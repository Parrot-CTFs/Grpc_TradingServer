const { PrismaClient } = require("@prisma/client");
const stockPrices = require("../../kafka/consumers/stockPriceConsumer");

const prisma = new PrismaClient();

const buyService = {
  BuyTrade: async (call, callback) => {
    try {
      const { id, symbol, quantity, username } = call.request;

      let trade;

      if (id) {
        // Convert id to an integer
        const tradeIdInt = parseInt(id, 10);

        // Find the original trade to replay
        trade = await prisma.trade.findUnique({ where: { id: tradeIdInt } });
        if (!trade) {
          return callback({
            code: 404,
            message: `Trade with ID ${id} not found.`,
          });
        }
      }

      const stock = await prisma.stock.findUnique({ where: { symbol } });
      const user = await prisma.user.findUnique({ where: { username } });

      if (!stock || !user) {
        return callback({
          code: 400,
          message: `Invalid request.`,
        });
      }

      const price = stockPrices[symbol];
      const cost = price * quantity;

      // Skip balance check if replaying a trade
      if (!id && user.balance < cost) {
        return callback({
          code: 400,
          message: `Insufficient balance.`,
        });
      }

      if (!id) {
        await prisma.user.update({
          where: { username },
          data: { balance: user.balance - cost },
        });
      }

      // Replay or create the trade
      if (id) {
        // Replay the original trade without checking balance
        trade = await prisma.trade.create({
          data: {
            symbol: trade.symbol,
            quantity: trade.quantity,
            price: trade.price,
            action: trade.action,
            userId: trade.userId,
            stockId: trade.stockId,
          },
        });
      } else {
        // Process a new trade
        trade = await prisma.trade.create({
          data: {
            symbol,
            quantity,
            price: parseFloat(price),
            action: "buy",
            userId: user.id,
            stockId: stock.id,
          },
        });
      }

      callback(null, { trade });
    } catch (error) {
      console.error("Error during BuyTrade:", error);
      return callback({
        code: 2, // UNKNOWN
        message: "An unknown error occurred.",
      });
    }
  },
};
module.exports = buyService;
