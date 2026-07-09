import React, { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { toast } from "react-toastify";
import axios from "axios";
import useFullScreen from "../../components/useFullScreen";

const Common_Setting = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
  const token = localStorage.getItem("token");

  const [isOpen, setOpen] = useState(true);
  const { isFullScreen, toggleFullScreen } = useFullScreen();

  const [existing, setExisting] = useState(null); // current saved setting
  const [submitting, setSubmitting] = useState(false);

  // image previews (local file selection)
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewFooter, setPreviewFooter] = useState(null);
  const [previewFavicon, setPreviewFavicon] = useState(null);

  const [form, setForm] = useState({
    restro_name: "",
    email: "",
    phone: "",
    phone_optional: "",
    address: "",
    powerbytxt: "",
    logo: null,
    logo_footer: null,
    fevicon: null,
  });

  const [errors, setErrors] = useState({});

  // ── fetch existing setting ──────────────────────────────────────
  const fetchSetting = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/websetting`, {
        headers: { Authorization: token },
      });
      const d = res.data.data;
      if (d) {
        setExisting(d);
        setForm({
          restro_name: d.restro_name || "",
          email: d.email || "",
          phone: d.phone || "",
          phone_optional: d.phone_optional || "",
          address: d.address || "",
          powerbytxt: d.powerbytxt || "",
          logo: null,
          logo_footer: null,
          fevicon: null,
        });
      }
    } catch (err) {
      console.error("fetchSetting error:", err);
    }
  };

  useEffect(() => { fetchSetting(); }, []);

  // ── input handlers ──────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFile = (field, file) => {
    setForm((prev) => ({ ...prev, [field]: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      if (field === "logo") setPreviewLogo(url);
      if (field === "logo_footer") setPreviewFooter(url);
      if (field === "fevicon") setPreviewFavicon(url);
    }
  };

  // ── validation ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.restro_name.trim()) e.restro_name = "Restaurant name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.address.trim()) e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const fd = new FormData();
    fd.append("restro_name", form.restro_name);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    fd.append("phone_optional", form.phone_optional);
    fd.append("address", form.address);
    fd.append("powerbytxt", form.powerbytxt);
    if (form.logo) fd.append("logo", form.logo);
    if (form.logo_footer) fd.append("logo_footer", form.logo_footer);
    if (form.fevicon) fd.append("fevicon", form.fevicon);

    try {
      await axios.post(`${API_BASE_URL}/csetting`, fd, {
        headers: { Authorization: token },
      });
      toast.success("Setting saved successfully!");
      await fetchSetting();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save setting.");
    }
    setSubmitting(false);
  };

  // ── image src helper ────────────────────────────────────────────
  const imgSrc = (filename, preview) => {
    if (preview) return preview;
    if (filename) return `${VITE_IMG_URL}${filename}`;
    return null;
  };

  const inputClass =
    "shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

  return (
    <div className="main_div">
      <section className="side_section flex">
        <div
          className={`${
            isOpen
              ? "hidden"
              : "nav-container hide-scrollbar h-screen overflow-y-auto"
          }`}
        >
          <Nav />
        </div>
        <header>
          <Hamburger toggled={isOpen} toggle={setOpen} />
        </header>

        <div className="content_div w-full ml-4 pr-7 mt-4 nav-container hide-scrollbar h-screen overflow-y-auto">
          {/* Page header */}
          <div className="active_tab flex justify-between">
            <h1 className="flex items-center gap-1 font-semibold">
              General Setting
            </h1>
            <div className="notification flex gap-x-5">
              <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              <MdOutlineZoomOutMap
                onClick={toggleFullScreen}
                className="bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
              />
            </div>
          </div>

          {/* Form card */}
          <div className="mt-8 border border-[#4CBBA1] bg-white rounded-sm">
            <form onSubmit={handleSubmit}>
              <div className="pt-11 pb-16 pr-16 pl-4">

                {/* Restro Name */}
                <div className="mb-8 flex gap-x-7 items-start">
                  <label className="w-[220px] text-right text-nowrap text-gray-700 font-semibold pt-2 shrink-0">
                    Restro Name <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full">
                    <input
                      type="text"
                      name="restro_name"
                      value={form.restro_name}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter restaurant name"
                    />
                    {errors.restro_name && <p className="text-red-500 text-xs mt-1">{errors.restro_name}</p>}
                  </div>
                </div>

                {/* Email */}
                <div className="mb-8 flex gap-x-7 items-start">
                  <label className="w-[220px] text-right text-nowrap text-gray-700 font-semibold pt-2 shrink-0">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full">
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Phone */}
                <div className="mb-8 flex gap-x-7 items-start">
                  <label className="w-[220px] text-right text-nowrap text-gray-700 font-semibold pt-2 shrink-0">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full">
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={15}
                      className={inputClass}
                      placeholder="Enter mobile number"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Optional Phone */}
                <div className="mb-8 flex gap-x-7 items-start">
                  <label className="w-[220px] text-right text-nowrap text-gray-700 font-semibold pt-2 shrink-0">
                    Phone Number
                  </label>
                  <div className="w-full">
                    <input
                      type="text"
                      name="phone_optional"
                      value={form.phone_optional}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter optional phone"
                    />
                  </div>
                </div>

                {/* Logo */}
                {[
                  { field: "logo", label: "Logo", preview: previewLogo },
                  { field: "logo_footer", label: "Footer Logo", preview: previewFooter },
                  { field: "fevicon", label: "Fav & Nav Icon", preview: previewFavicon },
                ].map(({ field, label, preview }) => (
                  <div key={field} className="mb-8 flex gap-x-7 items-start">
                    <label className="w-[220px] text-right text-gray-700 font-semibold pt-2 shrink-0">
                      {label}
                      <p className="text-xs text-gray-400 font-normal">Select to change</p>
                    </label>
                    <div className="flex items-center gap-4 w-full">
                      <input
                        type="file"
                        accept="image/png,image/jpg,image/jpeg,image/svg+xml"
                        onChange={(e) => handleFile(field, e.target.files[0])}
                        className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 focus:outline-none"
                      />
                      {imgSrc(existing?.[field], preview) && (
                        <img
                          src={imgSrc(existing?.[field], preview)}
                          alt={label}
                          className="w-20 h-14 object-contain border border-gray-200 rounded"
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* Address */}
                <div className="mb-8 flex gap-x-7 items-start">
                  <label className="w-[220px] text-right text-nowrap text-gray-700 font-semibold pt-2 shrink-0">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full">
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                      placeholder="Enter address"
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>
                </div>

                {/* Powered By */}
                <div className="mb-8 flex gap-x-7 items-start">
                  <label className="w-[220px] text-right text-nowrap text-gray-700 font-semibold pt-2 shrink-0">
                    Powered By Text
                  </label>
                  <div className="w-full">
                    <textarea
                      name="powerbytxt"
                      value={form.powerbytxt}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                      placeholder="e.g. Powered by XYZ"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-x-3 mt-4">
                  <button
                    type="button"
                    onClick={fetchSetting}
                    className="w-[104px] h-[42px] bg-[#4CBBA1] text-white rounded-md hover:opacity-90"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : existing ? "Update" : "Save"}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Common_Setting;
