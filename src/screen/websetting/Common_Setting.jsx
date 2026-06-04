// import React, { useEffect, useState } from "react";
// import Nav from "../../components/Nav";
// import Hamburger from "hamburger-react";
// import { IoMdNotifications } from "react-icons/io";
// import { MdOutlineZoomOutMap } from "react-icons/md";
// import { toast } from "react-toastify";
// import { Formik, Form, Field, ErrorMessage } from "formik";
// import * as Yup from "yup";
// import axios from "axios";
// import useFullScreen from "../../components/useFullScreen";
// import HasPermission from "../../store/HasPermission";

// const Common_Setting = () => {
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//   const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
//   const token = localStorage.getItem("token");
//   const [isOpen, setOpen] = useState(true);
//   const [dataa, setdataa] = useState([]);
//   const { isFullScreen, toggleFullScreen } = useFullScreen();

//   const initialValues = {
//     restro_name: "",
//     email: "",
//     phone: "",
//     phone_optional: "",
//     logo: null,
//     logo_footer: null,
//     fevicon: null,
//     address: "",
//     powerbytxt: "",
//     pos_id: localStorage.getItem("userId") || "",
//   };

//   const validationSchema = Yup.object().shape({
//     restro_name: Yup.string().required("Restaurant name is required"),
//     email: Yup.string()
//       .email("Invalid email address")
//       .required("Email is required"),
//     phone: Yup.string()
//       .matches(/^[0-9]+$/, "Phone number must be digits only")
//       .required("Phone number is required"),
//     address: Yup.string().required("Address is required"),
//     logo: Yup.mixed()
//       .test(
//         "fileType",
//         "Only png, jpg, jpeg, svg files are allowed",
//         (value) =>
//           !value ||
//           (value &&
//             ["image/png", "image/jpg", "image/jpeg", "image/svg+xml"].includes(
//               value.type,
//             )),
//       )
//       .test(
//         "fileSize",
//         "File too large, max 2MB",
//         (value) => !value || (value && value.size <= 2 * 1024 * 1024),
//       ),
//     logo_footer: Yup.mixed()
//       .test(
//         "fileType",
//         "Only png, jpg, jpeg, svg files are allowed",
//         (value) =>
//           !value ||
//           (value &&
//             ["image/png", "image/jpg", "image/jpeg", "image/svg+xml"].includes(
//               value.type,
//             )),
//       )
//       .test(
//         "fileSize",
//         "File too large, max 2MB",
//         (value) => !value || (value && value.size <= 2 * 1024 * 1024),
//       ),
//     fevicon: Yup.mixed()
//       .test(
//         "fileType",
//         "Only png, jpg, jpeg, svg files are allowed",
//         (value) =>
//           !value ||
//           (value &&
//             ["image/png", "image/jpg", "image/jpeg", "image/svg+xml"].includes(
//               value.type,
//             )),
//       )
//       .test(
//         "fileSize",
//         "File too large, max 2MB",
//         (value) => !value || (value && value.size <= 2 * 1024 * 1024),
//       ),
//   });

//   const handleSubmit = async (values, { setSubmitting, resetForm }) => {
//     const postData = new FormData();
//     Object.keys(values).forEach((key) => {
//       if (values[key] !== null && values[key] !== "") {
//         postData.append(key, values[key]);
//       }
//     });

//     try {
//       const response = await axios.post(
//         `${API_BASE_URL}/postcommission`,
//         postData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: token,
//           },
//         },
//       );
//       console.log("Response:", response.data);
//       toast.success("Update setting successfully!");
//       setSubmitting(false);
//       // resetForm(); // Uncomment if you want to reset after submit
//     } catch (error) {
//       console.error("Error submitting form:", error);
//       toast.error("Failed to submit the form.");
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="main_div">
//       <section className="side_section flex">
//         <div
//           className={`${
//             isOpen === false
//               ? "hidden"
//               : "nav-container hide-scrollbar h-screen overflow-y-auto"
//           }`}
//         >
//           <Nav />
//         </div>
//         <header>
//           <Hamburger toggled={isOpen} toggle={setOpen} />
//         </header>
//         <div className="contant_div w-full ml-4 pr-7 mt-4 nav-container hide-scrollbar h-screen overflow-y-auto">
//           <div className="activtab flex justify-between">
//             <h1 className="flex items-center justify-center gap-1 font-semibold">
//               General Setting
//             </h1>
//             <div className="notification flex gap-x-5">
//               <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
//               <MdOutlineZoomOutMap
//                 onClick={toggleFullScreen}
//                 className="bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
//               />
//             </div>
//           </div>

//           <div className="mt-28 border-[1px] border-[#4CBBA1] bg-white rounded-sm">
//             <Formik
//               initialValues={initialValues}
//               validationSchema={validationSchema}
//               onSubmit={handleSubmit}
//             >
//               {({ setFieldValue, isSubmitting, values }) => (
//                 <Form>
//                   <div className="pt-11 pb-16 pr-24">
//                     {/* Restaurant Name */}
//                     <div className="mb-11 flex gap-x-7">
//                       <label className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2">
//                         Restro Name
//                       </label>
//                       <Field
//                         type="text"
//                         name="restro_name"
//                         className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                       />
//                       <ErrorMessage
//                         name="restro_name"
//                         component="div"
//                         className="text-red-500 text-sm mt-1"
//                       />
//                     </div>

//                     {/* Email */}
//                     <div className="mb-11 flex gap-x-7">
//                       <label className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2">
//                         Email Address
//                       </label>
//                       <Field
//                         type="email"
//                         name="email"
//                         className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                       />
//                       <ErrorMessage
//                         name="email"
//                         component="div"
//                         className="text-red-500 text-sm mt-1"
//                       />
//                     </div>

//                     {/* Phone */}
//                     <div className="mb-11 flex gap-x-7">
//                       <label className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2">
//                         Mobile Number
//                       </label>
//                       <Field
//                         type="text"
//                         name="phone"
//                         maxLength={15}
//                         className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                       />
//                       <ErrorMessage
//                         name="phone"
//                         component="div"
//                         className="text-red-500 text-sm mt-1"
//                       />
//                     </div>

//                     {/* Optional Phone */}
//                     <div className="mb-11 flex gap-x-7">
//                       <label className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2">
//                         Phone Number
//                       </label>
//                       <Field
//                         type="text"
//                         name="phone_optional"
//                         className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                       />
//                       <ErrorMessage
//                         name="phone_optional"
//                         component="div"
//                         className="text-red-500 text-sm mt-1"
//                       />
//                     </div>

//                     {/* File Inputs */}
//                     {["logo", "logo_footer", "fevicon"].map((fileName, idx) => (
//                       <div key={idx} className="mb-11 flex gap-x-2">
//                         <div className="flex gap-x-7">
//                           <label className="m-auto w-[230px] text-right text-nowrap text-gray-700 font-semibold mb-2">
//                             {fileName === "fevicon"
//                               ? "Fav & Nav Icon"
//                               : fileName === "logo_footer"
//                                 ? "Footer Logo"
//                                 : "Logo"}
//                             <h1 className="text-xs">Select icon for change</h1>
//                           </label>
//                           <input
//                             type="file"
//                             name={fileName}
//                             onChange={(e) =>
//                               setFieldValue(fileName, e.currentTarget.files[0])
//                             }
//                             className="shadow border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                           />
//                           <ErrorMessage
//                             name={fileName}
//                             component="div"
//                             className="text-red-500 text-sm mt-1"
//                           />
//                           <div>
//                             {dataa.map((val) => (
//                               <img
//                                 key={val.id}
//                                 src={`${VITE_IMG_URL}${val[fileName]}`}
//                                 alt="preview"
//                                 className="w-[200px] h-[100px] mx-auto text-wrap text-sm"
//                               />
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     ))}

//                     {/* Address */}
//                     <div className="mb-11 flex gap-x-7">
//                       <label className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2">
//                         Address
//                       </label>
//                       <Field
//                         as="textarea"
//                         name="address"
//                         className="shadow w-full h-[100px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                       />
//                       <ErrorMessage
//                         name="address"
//                         component="div"
//                         className="text-red-500 text-sm mt-1"
//                       />
//                     </div>

//                     {/* Powered By Text */}
//                     <div className="mb-11 gap-x-7">
//                       <label className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2">
//                         Powered By Text
//                       </label>
//                       <Field
//                         as="textarea"
//                         name="powerbytxt"
//                         className="shadow w-full h-[100px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//                       />
//                       <ErrorMessage
//                         name="powerbytxt"
//                         component="div"
//                         className="text-red-500 text-sm mt-1"
//                       />
//                     </div>

//                     {/* Buttons */}
//                     <HasPermission module="Add User" action="create">
//                       <div className="float-right flex ml-16 space-x-4">
//                         <button
//                           type="reset"
//                           className="w-[104px] h-[42px] bg-[#4CBBA1] text-gray-50 rounded-md"
//                         >
//                           Reset
//                         </button>
//                         <button
//                           type="submit"
//                           disabled={isSubmitting}
//                           className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md"
//                         >
//                           {isSubmitting ? "Submitting..." : "Update"}
//                         </button>
//                       </div>
//                     </HasPermission>
//                   </div>
//                 </Form>
//               )}
//             </Formik>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Common_Setting;

import React, { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { toast } from "react-toastify";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import useFullScreen from "../../components/useFullScreen";

const Common_Setting = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
  const token = localStorage.getItem("token");

  const [isOpen, setOpen] = useState(true);
  const { toggleFullScreen } = useFullScreen();

  const [data, setData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // ================= GET =================
  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/getcomissiondata`);
      const d = res.data.data;
      setData(d ? [d] : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= DELETE =================
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/deletecomission/${id}`);
      toast.success("Deleted Successfully");
      setData([]); // 🔥 important
    } catch {
      toast.error("Delete Failed");
    }
  };

  // ================= VALIDATION =================
  const validationSchema = Yup.object({
    restro_name: Yup.string().required("Required"),
    email: Yup.string().email().required("Required"),
    phone: Yup.string().required("Required"),
    address: Yup.string().required("Required"),
  });

  // ================= SUBMIT =================
  const handleSubmit = async (values, { setSubmitting }) => {
    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      if (values[key]) formData.append(key, values[key]);
    });

    try {
      await axios.post(`${API_BASE_URL}/postcommission`, formData, {
        headers: { Authorization: token },
      });

      toast.success("Saved Successfully");
      setOpenModal(false);
      setEditData(null);
      fetchData();
    } catch {
      toast.error("Error");
    }

    setSubmitting(false);
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      {isOpen && (
        <div className="w-[250px] bg-white shadow-lg">
          <Nav />
        </div>
      )}

      {/* Main */}
      <div className="w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Hamburger toggled={isOpen} toggle={setOpen} />

          <div className="flex gap-3">
            <IoMdNotifications className="bg-[#1C1D3E] text-white p-2 text-4xl rounded-lg" />
            <MdOutlineZoomOutMap
              onClick={toggleFullScreen}
              className="bg-[#1C1D3E] text-white p-2 text-4xl rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Top */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#1C1D3E]">Common Settings</h1>

          <button
            disabled={data.length > 0}
            onClick={() => {
              setEditData(data[0] || null);
              setOpenModal(true);
            }}
            className={`px-5 py-2 rounded-lg text-white ${
              data.length > 0 ? "bg-gray-400" : "bg-[#1C1D3E] hover:opacity-90"
            }`}
          >
            Add Setting
          </button>
        </div>

        {/* Card View (better than table 🔥) */}
        {data.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-2 gap-4">
              <p>
                <b>Name:</b> {data[0].restro_name}
              </p>
              <p>
                <b>Email:</b> {data[0].email}
              </p>
              <p>
                <b>Phone:</b> {data[0].phone}
              </p>
              <p>
                <b>Alt Phone:</b> {data[0].phone_optional}
              </p>
              <p>
                <b>Address:</b> {data[0].address}
              </p>
              <p>
                <b>Powered By:</b> {data[0].powerbytxt}
              </p>
            </div>

            {/* Images */}
            <div className="flex gap-6 mt-4">
              <img
                src={`${VITE_IMG_URL}${data[0].logo}`}
                className="w-24 h-16 object-contain border"
              />
              <img
                src={`${VITE_IMG_URL}${data[0].logo_footer}`}
                className="w-24 h-16 object-contain border"
              />
              <img
                src={`${VITE_IMG_URL}${data[0].fevicon}`}
                className="w-16 h-16 object-contain border"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditData(data[0]);
                  setOpenModal(true);
                }}
                className="px-4 py-2 bg-[#1C1D3E] text-white rounded-lg"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(data[0].id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {openModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white w-[700px] p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-[#1C1D3E]">
                {editData ? "Edit Setting" : "Add Setting"}
              </h2>

              <Formik
                initialValues={
                  editData || {
                    restro_name: "",
                    email: "",
                    phone: "",
                    phone_optional: "",
                    address: "",
                    powerbytxt: "",
                  }
                }
                enableReinitialize
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ setFieldValue }) => (
                  <Form className="grid grid-cols-2 gap-4">
                    <Field
                      name="restro_name"
                      placeholder="Name"
                      className="input"
                    />
                    <Field name="email" placeholder="Email" className="input" />
                    <Field name="phone" placeholder="Phone" className="input" />
                    <Field
                      name="phone_optional"
                      placeholder="Alt Phone"
                      className="input"
                    />

                    <Field
                      as="textarea"
                      name="address"
                      placeholder="Address"
                      className="col-span-2 input"
                    />
                    <Field
                      as="textarea"
                      name="powerbytxt"
                      placeholder="Powered By"
                      className="col-span-2 input"
                    />

                    {/* Files */}
                    <input
                      type="file"
                      onChange={(e) => setFieldValue("logo", e.target.files[0])}
                    />
                    <input
                      type="file"
                      onChange={(e) =>
                        setFieldValue("logo_footer", e.target.files[0])
                      }
                    />
                    <input
                      type="file"
                      onChange={(e) =>
                        setFieldValue("fevicon", e.target.files[0])
                      }
                    />

                    {/* Buttons */}
                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setOpenModal(false)}
                        className="px-4 py-2 bg-gray-400 rounded"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#1C1D3E] text-white rounded"
                      >
                        Save
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Common_Setting;
