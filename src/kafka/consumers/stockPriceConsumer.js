const { KafkaClient, Consumer } = require("kafka-node");

const client = new KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const consumer = new Consumer(
  client,
  [{ topic: "stock-prices", partition: 0 }],
  { autoCommit: true },
);

const stockPrices = {}; // In-memory store for the latest stock prices

consumer.on("message", (message) => {
  try {
    const { symbol, price } = JSON.parse(message.value);
    // Only log and update if the price is different
    if (stockPrices[symbol] !== price) {
      stockPrices[symbol] = price;
    }
  } catch (error) {
    console.error("Failed to process message in Consumer:", error);
  }
});

consumer.on("error", (err) => {
  console.error("Error in Kafka Consumer:", err);
});

module.exports = stockPrices;
