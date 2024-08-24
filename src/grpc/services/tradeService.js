const { PrismaClient } = require("@prisma/client");
const stockPrices = require("../../kafka/consumers/stockPriceConsumer"); // Import the in-memory stock prices

const prisma = new PrismaClient();

const tradeService = {
  ListStocks: async (call, callback) => {
    try {
      const stocks = await prisma.stock.findMany();

      const stockList = stocks.map((stock) => ({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
      }));

      callback(null, { stocks: stockList });
    } catch (error) {
      console.error("Error fetching stocks:", error);
      callback({
        code: 500,
        message: "Failed to list stocks",
      });
    }
  },

  ListTrades: async (call, callback) => {
    try {
      const trades = await prisma.trade.findMany({
        include: {
          stock: true,
          user: true,
        },
      });

      const tradeList = trades.map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        quantity: trade.quantity,
        price: trade.price,
        action: trade.action,
        userId: trade.userId,
        stockId: trade.stockId,
        createdAt: trade.createdAt.toISOString(),
        user: {
          id: trade.user.id,
          username: trade.user.username,
          balance: trade.user.balance,
        },
        stock: {
          id: trade.stock.id,
          symbol: trade.stock.symbol,
          name: trade.stock.name,
        },
      }));

      callback(null, { trades: tradeList });
    } catch (error) {
      console.error("Error fetching trades:", error);
      callback({
        code: 500,
        message: "Failed to list trades",
      });
    }
  },
  GetUserHoldings: async (call, callback) => {
    const { username } = call.request;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        trades: true, // Include all trades (both buy and sell)
      },
    });

    if (!user) {
      return callback({
        code: 404,
        message: `User ${username} not found.`,
      });
    }

    // Aggregate net quantities by symbol
    const holdingsMap = new Map();

    user.trades.forEach((trade) => {
      const currentQuantity = holdingsMap.get(trade.symbol) || 0;
      if (trade.action === "buy") {
        holdingsMap.set(trade.symbol, currentQuantity + trade.quantity);
      } else if (trade.action === "sell") {
        holdingsMap.set(trade.symbol, currentQuantity - trade.quantity);
      }
    });

    // Filter out stocks with zero or negative quantities
    const holdings = Array.from(holdingsMap, ([symbol, quantity]) => ({
      symbol,
      quantity,
    })).filter((holding) => holding.quantity > 0);

    callback(null, { stocks: holdings });
  },

  StreamStockPrices: (call) => {
    const { symbols } = call.request;

    if (!symbols || symbols.length === 0) {
      console.error("No symbols provided for streaming.");
      call.end();
      return;
    }

    console.log(`Starting streaming for symbols: ${symbols.join(", ")}`);

    const sendPriceUpdates = () => {
      try {
        symbols.forEach((symbol) => {
          let price = stockPrices[symbol];
          console.log(`Current price for ${symbol}: ${price}`);

          if (price) {
            console.log(`Sending update for ${symbol}: $${price}`);
            call.write({ symbol, price: parseFloat(price) });
          } else {
            console.warn(
              `Price for ${symbol} is not available yet, retrying...`,
            );
            // Retry logic: Keep trying to send the price until it becomes available
            const retryInterval = setInterval(() => {
              price = stockPrices[symbol];
              console.log(`Retry - Current price for ${symbol}: ${price}`);
              if (price) {
                console.log(`Sending delayed update for ${symbol}: $${price}`);
                call.write({ symbol, price: parseFloat(price) });
                clearInterval(retryInterval); // Stop retrying once the price is available
              }
            }, 1000); // Retry every second
          }
        });
      } catch (error) {
        console.error("Error during sendPriceUpdates:", error);
        call.end(); // Terminate the stream if an error occurs
      }
    };

    const intervalId = setInterval(sendPriceUpdates, 5000); // Send updates every 5 seconds

    call.on("end", () => {
      console.log("Client ended the stream.");
      clearInterval(intervalId);
      call.end();
    });

    call.on("error", (err) => {
      console.error("Streaming error:", err);
      clearInterval(intervalId);
      call.end();
    });
  },

  UserBalance: async (call, callback) => {
    const { username } = call.request;

    try {
      const user = await prisma.user.findUnique({ where: { username } });

      if (!user) {
        return callback({
          code: 404,
          message: `User ${username} not found.`,
        });
      }

      let response = {
        balance: user.balance,
      };

      if (user.balance >= 200000) {
        response.flag = "ssh:password";
      } else {
        response.hint =
          "Hint: Flag will be generated here when you have a $200,000 balance.";
      }

      console.log("Final Response:", response); // Log to verify correct response structure

      callback(null, response); // Send full response
    } catch (error) {
      console.error("Error fetching user balance:", error);
      callback({
        code: 500,
        message: "Failed to fetch user balance",
      });
    }
  },
};

module.exports = tradeService;
