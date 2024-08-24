const { KafkaClient, Consumer } = require("kafka-node");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const stockPrices = {}; // Store prices in-memory

const client = new KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const consumer = new Consumer(
  client,
  [{ topic: "stock-prices", partition: 0 }],
  {
    autoCommit: true,
  },
);

consumer.on("message", (message) => {
  try {
    const { symbol, price } = JSON.parse(message.value);
    stockPrices[symbol] = price;
    console.log(`Updated price for ${symbol}: ${price}`);
  } catch (err) {
    console.error("Error parsing message:", err);
  }
});

consumer.on("error", (err) => {
  console.error("Error in Kafka Consumer:", err);
});

module.exports = stockPrices;
