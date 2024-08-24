const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Load your service files
const buyService = require("./services/buyService.js");
const sellService = require("./services/sellService.js");
const tradeService = require("./services/tradeService.js");

// Path to your .proto file
const tradeProtoPath = path.join(__dirname, "protos", "trade.proto");

// Load the .proto file
const tradeProtoDefinition = protoLoader.loadSync(tradeProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load the package definition
const tradeProto = grpc.loadPackageDefinition(tradeProtoDefinition).trade;

// Main function to start the gRPC server
function main() {
  const server = new grpc.Server();

  // Add services to the server
  server.addService(tradeProto.TradeService.service, {
    BuyTrade: buyService.BuyTrade,
    SellTrade: sellService.SellTrade,
    ListStocks: tradeService.ListStocks,
    ListTrades: tradeService.ListTrades,
    UserBalance: tradeService.UserBalance,
    GetUserHoldings: tradeService.GetUserHoldings,
    StreamStockPrices: tradeService.StreamStockPrices,
  });

  // Start the server and bind to port 50051
  server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error("Failed to start gRPC server:", err);
        return;
      }
      console.log(`gRPC server running on port ${port}`);
      server.start();
    },
  );
}

// Start the server
main();
