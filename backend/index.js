const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const dataRoutes = require("./router/categoryRoute");
const printerRoutes = require("./router/printerRoute");
const kitchenRoutes = require("./router/kitchenRoute");
const addOneRoutes = require("./router/addoneRoute");
const addFloorRoutes = require("./router/addFloorRoute");
const addtableRoutes = require("./router/addTableRoute");
const addUnitMasurmentRouts = require("./router/addUnitMasurmentRout");
const ingredientRouts = require("./router/ingredientRoute");
const addFoodRouts = require("./router/addFoodRoute");
const menuTypeRouts = require("./router/menuTypeRoute");
const addCustomer = require("./router/addCustomerRoute");
const customerTypeRouts = require("./router/custometTypeRoute");
const posRouts = require("./router/posRoute");
const paynmentRouts = require("./router/paynmentRoute");
const purchasemanageRouts = require("./router/purchasemanageRoute");
const reportRouts = require("./router/reportRoute");
const reservationRouts = require("./router/reservationRoute");
const recipeRouts = require("./router/racipeRouts");
const roleandpremission = require("./router/roleandpermission");
const wastetracking = require("./router/wastetrackingRoute");
const userRouts = require("./router/userRoute");
const hrmRouts = require("./router/hrmRouts");
const leaveRouts = require("./router/leaveRoute");
const expenseRouts = require("./router/expenseRoute");
const CommissionSettingsRouts = require("./router/comissionSettingRoute");
const webSettingRouts = require("./router/webSettingRoute");
const cashRegisterRouts = require("./router/cashRegisterRoute");
const holdorderRouts = require("./router/holdOrderRoute");
const webuserRouts = require("./router/webUserRoute");
const shippingRoute = require("./router/shippingTypeRoute");
const pointRoute = require("./router/loyaltyRoute");
const splitorderRoute = require("./router/splitOrderRouts");
const kotprint = require("./router/printkotRoute");
const subscriptionRoute = require("./router/subscriptionRoute");
const {
  syncCategories,
  syncFloors,
  syncTables,
  syncPurchaseItems,
  syncProduction,
} = require("./services/syncService");
const { syncAddons } = require("./services/syncQrService");
const app = express();

// Middleware
app.use(cors());

setInterval(() => {
  syncAddons();
  syncProduction();
  syncPurchaseItems();
  syncCategories();
  syncFloors();
  syncTables();
}, 30000);

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static("asset/category")); // Serve static files from the 'asset' directory
app.use(express.static("asset/icon"));
app.use(express.static("asset/user"));

// Routes
app.use("/api", dataRoutes);
app.use("/api", printerRoutes);
app.use("/api", kitchenRoutes);
app.use("/api", addOneRoutes);
app.use("/api", addFloorRoutes);
app.use("/api", addtableRoutes);
app.use("/api", addUnitMasurmentRouts);
app.use("/api", ingredientRouts);
app.use("/api", addFoodRouts);
app.use("/api", menuTypeRouts);
app.use("/api", addCustomer);
app.use("/api", customerTypeRouts);
app.use("/api", posRouts);
app.use("/api", paynmentRouts);
app.use("/api", purchasemanageRouts);
app.use("/api", reportRouts);
app.use("/api", reservationRouts);
app.use("/api", recipeRouts);
app.use("/api", roleandpremission);
app.use("/api", userRouts);
app.use("/api", wastetracking);
app.use("/api", hrmRouts);
app.use("/api", leaveRouts);
app.use("/api", expenseRouts);
app.use("/api", CommissionSettingsRouts);
app.use("/api", webSettingRouts);
app.use("/api", cashRegisterRouts);
app.use("/api", holdorderRouts);
app.use("/api", webuserRouts);
app.use("/api", shippingRoute);
app.use("/api", pointRoute);
app.use("/api", splitorderRoute);
app.use("/api", kotprint);
app.use("/api", subscriptionRoute);
app.use("/uploads", express.static("uploads"));

// Error handling middleware (generic error handler)
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Root route (optional)
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

// Start the server
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}...`);

  if (process.send) {
    process.send("backend-ready");
  }
});
