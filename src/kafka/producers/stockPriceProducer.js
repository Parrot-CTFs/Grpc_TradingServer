const { KafkaClient, Producer } = require("kafka-node");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const client = new KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const producer = new Producer(client);

producer.on("ready", async () => {
  console.log("Kafka Producer is connected and ready.");

  const stocks = await prisma.stock.findMany({
    select: { symbol: true },
  });

  const stockSymbols = stocks.map((stock) => stock.symbol);

  setInterval(() => {
    stockSymbols.forEach((symbol) => {
      const price = (Math.random() * 1000).toFixed(2);
      const message = JSON.stringify({ symbol, price });
      const payloads = [{ topic: "stock-prices", messages: message }];
      producer.send(payloads, (err, data) => {
        if (err) {
          console.error(
            "Failed to send stock price to Kafka from Producer:",
            err,
          );
        } else {
          console.log(
            `Producer: Stock price for ${symbol} published to Kafka: $${price}`,
          );
        }
      });
    });
  }, 3000);
});

producer.on("error", (err) => {
  console.error("Error in Kafka Producer:", err);
});
