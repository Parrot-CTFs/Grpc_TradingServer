const { PrismaClient } = require("@prisma/client");
const stockPrices = require("../../kafka/consumers/stockPriceConsumer");

const prisma = new PrismaClient();

const sellService = {
  SellTrade: async (call, callback) => {
    const { id, symbol, quantity, username } = call.request;

    // Only allow the attacker to sell
    if (username !== "attacker") {
      return callback({
        code: 403,
        message: "Only the attacker is allowed to sell stocks.",
      });
    }

    let trade;

    if (id) {
      const tradeIdInt = parseInt(id, 10);
      trade = await prisma.trade.findUnique({ where: { id: tradeIdInt } });
      if (!trade) {
        return callback({
          code: 404,
          message: `Trade with ID ${id} not found.`,
        });
      }
    }

    const stock = await prisma.stock.findUnique({ where: { symbol } });
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        trades: true,
      },
    });

    if (!stock || !user) {
      return callback({
        code: 400,
        message: `Invalid request.`,
      });
    }

    // Calculate total quantity held by the user for the given symbol
    const totalQuantityHeld = user.trades
      .filter((trade) => trade.symbol === symbol && trade.action === "buy")
      .reduce((acc, trade) => acc + trade.quantity, 0);

    // Calculate total quantity sold by the user for the given symbol
    const totalQuantitySold = user.trades
      .filter((trade) => trade.symbol === symbol && trade.action === "sell")
      .reduce((acc, trade) => acc + trade.quantity, 0);

    const availableQuantity = totalQuantityHeld - totalQuantitySold;

    if (availableQuantity < quantity) {
      return callback({
        code: 400,
        message: `Insufficient quantity to sell. Available: ${availableQuantity}`,
      });
    }

    const price = stockPrices[symbol];
    const revenue = price * quantity;

    // Record the sell trade
    trade = await prisma.trade.create({
      data: {
        symbol,
        quantity,
        price: parseFloat(price),
        action: "sell",
        userId: user.id,
        stockId: stock.id,
      },
    });

    // Update the user's balance after selling the stock
    await prisma.user.update({
      where: { username },
      data: { balance: user.balance + revenue },
    });

    callback(null, { trade });
  },
};

module.exports = sellService;
