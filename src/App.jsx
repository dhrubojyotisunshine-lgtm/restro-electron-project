import React, { useEffect, useState, useContext } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./store/ProtectedRoute";
import { AuthProvider } from "./store/AuthContext";
import Home from "./screen/Home";
import AddCategory from "./screen/foodmanagement/AddCategory";
import ComissionSetup from "./screen/mastersetup/ComissionSetup";
import ShippingType from "./screen/mastersetup/ShippingType";
import KitchenList from "./screen/mastersetup/KitchenList";
import AddFood from "./screen/foodmanagement/AddFood";
import AddOns from "./screen/foodmanagement/AddOns";
import CategoryList from "./screen/foodmanagement/CategoryList";
import FoodList from "./screen/foodmanagement/FoodList";
import MenuType from "./screen/foodmanagement/MenuType";
import CancleOrder from "./screen/manageorder/CancleOrder";
import CompleteOrder from "./screen/manageorder/CompleteOrder";
import CounterList from "./screen/manageorder/CounterList";
import OrdersList from "./screen/manageorder/OrdersList";
import PendingOrder from "./screen/manageorder/PendingOrder";
import PosSetting from "./screen/manageorder/PosSetting";
import SoundSetting from "./screen/manageorder/SoundSetting";
import AddFloor from "./screen/managetable/AddFloor";
import TableList from "./screen/managetable/TableList";
import AllTableQr from "./screen/managetable/AllTableQr";
import AddCustomer from "./screen/recipemanagement/AddCustomer";
import CustomerType from "./screen/recipemanagement/CustomerType";
import OnGoingOrder from "./screen/posscreen/OnGoingOrder";
import OnlineOrder from "./screen/posscreen/OnlineOrder";
import OrderList from "./screen/posscreen/OrderList";
import QrOrder from "./screen/posscreen/QrOrder";
import TodayOrder from "./screen/posscreen/TodayOrder";
import AddPrinters from "./screen/printers/AddPrinters";
import PrinterList from "./screen/printers/PrinterList";
import Designation from "./screen/humanresource/Designation";
import ManageEmploye from "./screen/humanresource/ManageEmploye";
import AddEmpolye from "./screen/humanresource/AddEmpolye";
import EditRole_Page from "./screen/roleandpermission/EditRole_Page";
import Department from "./screen/humanresource/Department";
import Division from "./screen/humanresource/Division";
import Add_user from "./screen/user_and_staf/Add_user";
import User_list from "./screen/user_and_staf/User_list";
import Holiday from "./screen/humanresource/Holiday";
import Leave_type from "./screen/humanresource/Leave_type";
import Leave_application from "./screen/humanresource/Leave_application";
import Addexpense_item from "./screen/humanresource/Addexpense_item";
import AddPurchase from "./screen/purchasemanage/AddPurchase";
import PurchaseItem from "./screen/purchasemanage/PurchaseItem";
import PurchaseReturn from "./screen/purchasemanage/PurchaseReturn";
import ReturnInvoice from "./screen/purchasemanage/ReturnInvoice";
import StockOutIngredients from "./screen/purchasemanage/StockOutIngredients";
import SupplierLadger from "./screen/purchasemanage/SupplierLadger";
import SupplierManage from "./screen/purchasemanage/SupplierManage";
import Add_expense from "./screen/humanresource/Add_expense";
import AddProduction from "./screen/recipemanagement/AddProduction";
import IngredientList from "./screen/recipemanagement/IngredientList";
import SetProductionUnit from "./screen/recipemanagement/SetProductinUnit";
import SetProductionList from "./screen/recipemanagement/SetProductionList";
import UnitMasurment from "./screen/recipemanagement/UnitMasurment";
import CashRegisterReport from "./screen/report/CashRegisterReport";
import Commission from "./screen/report/Commission";
import PurchaseReport from "./screen/report/PurchaseReport";
import SaleByDay from "./screen/report/SaleByDay";
import SaleReport from "./screen/report/SaleReport";
import SaleReportFilter from "./screen/report/SaleReportFilter";
import StockReportFoodItem from "./screen/report/StockReportFoodItem";
import StockReportKitchen from "./screen/report/StockReportKitchen";
import SaleByTable from "./screen/report/SaleByTable";
import WaiterSaleReport from "./screen/report/WaiterSaleReport";
import ServiceChargeReport from "./screen/report/ServiceChargeReport";
import SaleReportCashier from "./screen/report/SaleReportCashier";
import ItemSaleReport from "./screen/report/ItemSaleReport";
import Role_list from "./screen/roleandpermission/Role_list";
import Add_role from "./screen/roleandpermission/Add_role";
import User_Access_role from "./screen/roleandpermission/User_Access_role";
import AddBooking from "./screen/reservation/AddBooking";
import Reservation from "./screen/reservation/Reservation";
import ReservationSetting from "./screen/reservation/ReservationSetting";
import UnavilablityDays from "./screen/reservation/UnavilablityDays";
import PurchaseFoodwaste from "./screen/wastetracking/PurchaseFoodwaste";
import MakingFoodwaste from "./screen/wastetracking/MakingFoodwaste";
import PackagingFood from "./screen/wastetracking/PackagingFood";
import Log_in from "./screen/Log_in";
import ResetPassword from "./screen/ResetPassword";
import ForgetPassword from "./screen/ForgetPassword";
import EditOrder from "./screen/posscreen/EditOrder";
import Common_Setting from "./screen/websetting/Common_Setting";
import Cash_Register from "./screen/posscreen/Cash_Register";
import DeleverySaleReport from "./screen/report/DeleverySaleReport";
import QrOrder_Page from "./screen/qrorders/QrOrder_Page";
import Checkout_Order from "./screen/qrorders/Checkout_Order";
import EditQrOrder from "./screen/qrorders/EditQrOrder";
import Edit_qrPage from "./screen/qrorders/Edit_qrPage";
import Point_setting from "./screen/loyalty/Point_setting";
import Customer_point from "./screen/loyalty/Customer_point";
import InventoryStock from "./screen/purchasemanage/InventoryStock";
import KitchenStatus from "./screen/posscreen/KitchenStatus";
import KitchenDashboard from "./screen/manageorder/KitchenDashboard";
const App = () => {
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(() => {
    const savedStatus = localStorage.getItem("isCashRegisterOpen");
    return savedStatus === "true"; // returns true or false
  });
  const protectedRoute = (Component) => (
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
  );

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route path="/edit-role/:id" element={<EditRole_Page />} />
          <Route
            path="/edit-order/:id"
            element={
              <ProtectedRoute>
                <EditOrder />
              </ProtectedRoute>
            }
          />
          {/* Food Management */}
          <Route
            path="/add-category"
            element={
              <ProtectedRoute>
                <AddCategory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-food"
            element={
              <ProtectedRoute>
                <AddFood />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-ons"
            element={
              <ProtectedRoute>
                <AddOns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/category-list"
            element={
              <ProtectedRoute>
                <CategoryList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/food-list"
            element={
              <ProtectedRoute>
                <FoodList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/menu-type"
            element={
              <ProtectedRoute>
                <MenuType />
              </ProtectedRoute>
            }
          />

          {/* User & staff */}

          <Route
            path="/add-user"
            element={
              <ProtectedRoute>
                <Add_user />
              </ProtectedRoute>
            }
          ></Route>

          <Route
            path="/user-list"
            element={
              <ProtectedRoute>
                <User_list />
              </ProtectedRoute>
            }
          ></Route>

          {/* Manage Order */}
          <Route
            path="/cancel-order"
            element={
              <ProtectedRoute>
                <CancleOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen-dashboard"
            element={
              <ProtectedRoute>
                <KitchenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complete-order"
            element={
              <ProtectedRoute>
                <CompleteOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/counter-list"
            element={
              <ProtectedRoute>
                <CounterList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders-list"
            element={
              <ProtectedRoute>
                <OrdersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending-order"
            element={
              <ProtectedRoute>
                <PendingOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos-setting"
            element={
              <ProtectedRoute>
                <PosSetting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sound-setting"
            element={
              <ProtectedRoute>
                <SoundSetting />
              </ProtectedRoute>
            }
          />

          {/* Manage Table */}
          <Route
            path="/add-floor"
            element={
              <ProtectedRoute>
                <AddFloor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/table-list"
            element={
              <ProtectedRoute>
                <TableList />
              </ProtectedRoute>
            }
          />

          {/* Master Setup - Kitchen Setting */}

          <Route
            path="/alltable-Qr"
            element={
              <ProtectedRoute>
                <AllTableQr />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-type"
            element={
              <ProtectedRoute>
                <CustomerType />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-customer"
            element={
              <ProtectedRoute>
                <AddCustomer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/commission-setting"
            element={
              <ProtectedRoute>
                <ComissionSetup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/kitchen-list"
            element={
              <ProtectedRoute>
                <KitchenList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shipping-type"
            element={
              <ProtectedRoute>
                <ShippingType />
              </ProtectedRoute>
            }
          />

          {/* POS Screen */}
          <Route
            path="/ongoing-order"
            element={
              <ProtectedRoute>
                <OnGoingOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/online-order"
            element={
              <ProtectedRoute>
                <OnlineOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen-status"
            element={
              <ProtectedRoute>
                <KitchenStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-list"
            element={
              isCashRegisterOpen ? (
                <ProtectedRoute>
                  <OrderList setIsCashRegisterOpen={setIsCashRegisterOpen} />
                </ProtectedRoute>
              ) : (
                <Navigate to="/case-register" />
              )
            }
          />

          <Route
            path="/qr-order"
            element={
              <ProtectedRoute>
                <QrOrder />
              </ProtectedRoute>
            }
          />
          <Route path="/qr-orders/:tableId" element={<QrOrder_Page />} />

          <Route path="/checkout-order/:tableId" element={<Checkout_Order />} />

          <Route path="/editqrorder/:tableId" element={<EditQrOrder />} />
          <Route path="/editQrorderdata/:tableId" element={<Edit_qrPage />} />
          <Route
            path="/today-order"
            element={
              <ProtectedRoute>
                <TodayOrder />
              </ProtectedRoute>
            }
          />

          {/* Printers */}
          <Route
            path="/add-printers"
            element={
              <ProtectedRoute>
                <AddPrinters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/printer-list"
            element={
              <ProtectedRoute>
                <PrinterList />
              </ProtectedRoute>
            }
          />

          {/* Purchase Management */}
          <Route
            path="/add-purchase"
            element={
              <ProtectedRoute>
                <AddPurchase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-item"
            element={
              <ProtectedRoute>
                <PurchaseItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-return"
            element={
              <ProtectedRoute>
                <PurchaseReturn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/return-invoice"
            element={
              <ProtectedRoute>
                <ReturnInvoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-out-ingredients"
            element={
              <ProtectedRoute>
                <StockOutIngredients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stock-list"
            element={
              <ProtectedRoute>
                <InventoryStock />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supplier-ladger"
            element={
              <ProtectedRoute>
                <SupplierLadger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier-manage"
            element={
              <ProtectedRoute>
                <SupplierManage />
              </ProtectedRoute>
            }
          />

          {/* Recipe Management */}
          <Route
            path="/add-production"
            element={
              <ProtectedRoute>
                <AddProduction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ingredient-list"
            element={
              <ProtectedRoute>
                <IngredientList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/set-production-unit"
            element={
              <ProtectedRoute>
                <SetProductionUnit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/set-production-list"
            element={
              <ProtectedRoute>
                <SetProductionList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unit-measurement"
            element={
              <ProtectedRoute>
                <UnitMasurment />
              </ProtectedRoute>
            }
          />

          {/* roles and perimission */}

          <Route
            path="/rolelist"
            element={
              <ProtectedRoute>
                <Role_list />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-access-role"
            element={
              <ProtectedRoute>
                <User_Access_role />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-role"
            element={
              <ProtectedRoute>
                <Add_role />
              </ProtectedRoute>
            }
          />

          {/* 

{/*Loyalty*/}

          <Route
            path="/point-setting"
            element={
              <ProtectedRoute>
                <Point_setting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-point"
            element={
              <ProtectedRoute>
                <Customer_point />
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="/case-register-report"
            element={
              <ProtectedRoute>
                <CashRegisterReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliverytype-report"
            element={
              <ProtectedRoute>
                <DeleverySaleReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/commission"
            element={
              <ProtectedRoute>
                <Commission />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-report"
            element={
              <ProtectedRoute>
                <PurchaseReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/waitersale-report"
            element={
              <ProtectedRoute>
                <WaiterSaleReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/servicecharge-report"
            element={
              <ProtectedRoute>
                <ServiceChargeReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/itemsale-report"
            element={
              <ProtectedRoute>
                <ItemSaleReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cashier-report"
            element={
              <ProtectedRoute>
                <SaleReportCashier />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saleby-day"
            element={
              <ProtectedRoute>
                <SaleByDay />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sale-report"
            element={
              <ProtectedRoute>
                <SaleReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sale-report-filter"
            element={
              <ProtectedRoute>
                <SaleReportFilter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/foodstock-report"
            element={
              <ProtectedRoute>
                <StockReportFoodItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchenstock-report"
            element={
              <ProtectedRoute>
                <StockReportKitchen />
              </ProtectedRoute>
            }
          />

          <Route
            path="/saleby-table"
            element={
              <ProtectedRoute>
                <SaleByTable />
              </ProtectedRoute>
            }
          />

          {/* Reservation */}
          <Route
            path="/add-booking"
            element={
              <ProtectedRoute>
                <AddBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservation"
            element={
              <ProtectedRoute>
                <Reservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservation-setting"
            element={
              <ProtectedRoute>
                <ReservationSetting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unavailability-days"
            element={
              <ProtectedRoute>
                <UnavilablityDays />
              </ProtectedRoute>
            }
          />
          {/* Waste Tracking */}
          <Route
            path="/packaging-food"
            element={
              <ProtectedRoute>
                <PackagingFood />
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchasefood-waste"
            element={
              <ProtectedRoute>
                <PurchaseFoodwaste />
              </ProtectedRoute>
            }
          />

          <Route
            path="/makingfood-waste"
            element={
              <ProtectedRoute>
                <MakingFoodwaste />
              </ProtectedRoute>
            }
          />

          {/* Human Resourse */}

          <Route
            path="/designation"
            element={
              <ProtectedRoute>
                <Designation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manageemployee"
            element={
              <ProtectedRoute>
                <ManageEmploye />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-employee"
            element={
              <ProtectedRoute>
                <AddEmpolye />
              </ProtectedRoute>
            }
          />

          <Route
            path="/department"
            element={
              <ProtectedRoute>
                <Department />
              </ProtectedRoute>
            }
          />

          <Route
            path="/division"
            element={
              <ProtectedRoute>
                <Division />
              </ProtectedRoute>
            }
          />
          <Route
            path="/holiday"
            element={
              <ProtectedRoute>
                <Holiday />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leavetype"
            element={
              <ProtectedRoute>
                <Leave_type />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaveapplication"
            element={
              <ProtectedRoute>
                <Leave_application />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addexpenseitem"
            element={
              <ProtectedRoute>
                <Addexpense_item />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addexpense"
            element={
              <ProtectedRoute>
                <Add_expense />
              </ProtectedRoute>
            }
          />

          {/* Web setting */}

          <Route
            path="/common-setting"
            element={
              <ProtectedRoute>
                <Common_Setting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sound-setting"
            element={
              <ProtectedRoute>
                <SoundSetting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/case-register"
            element={
              <ProtectedRoute>
                <Cash_Register setIsCashRegisterOpen={setIsCashRegisterOpen} />
              </ProtectedRoute>
            }
          />

          {/* Log_in */}
          <Route path="/log-in" element={<Log_in />} />
          <Route path="/forgetpassword" element={<ForgetPassword />} />
          <Route path="/resetpassword/:id/:token" element={<ResetPassword />} />
          {/* Error */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
