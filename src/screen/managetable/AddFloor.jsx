import React, { useState, useEffect } from "react";
import TableModal from "./TableModal";
import { IoIosAddCircleOutline } from "react-icons/io";
import axios from "axios";
import { toast } from "react-toastify";

const AddFloor = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const [isTableModal, setIsTableModal] = useState(false);
  const [floors, setFloors] = useState([]);
  const [formdata, setFormdata] = useState({
    tablename: "",
    person_capicity: "",
    floorName: "",
  });
  const [file, setFile] = useState(null);

const { isFullScreen, toggleFullScreen } = useFullScreen();
  const closeTableModal = () => {
    setIsTableModal(false);
  };

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const submitTable = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("table_icon", file);
    formData.append("tablename", formdata.tablename);
    formData.append("person_capicity", formdata.person_capicity);
    formData.append("floorName", formdata.floorName);

    axios
      .post(`${API_BASE_URL}/table`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        console.log(res.data);
        console.log("data added");
        // Uncomment the next line if you want to update the state with the new table data
        // setTables([...tables, res.data.table]);
        closeTableModal();
      })
      .catch((err) => {
        console.log("Form data values:", {
          tablename: formdata.tablename,
          person_capicity: formdata.person_capicity,
          floorName: formdata.floorName,
          file,
        });
        if (err.response) {
          // Server responded with a status other than 200 range
          console.log("Error data:", err.response.data);
          console.log("Error status:", err.response.status);
          console.log("Error headers:", err.response.headers);
        } else if (err.request) {
          // Request was made but no response was received
          console.log("Error request:", err.request);
        } else {
          // Something else happened in setting up the request
          console.log("Error message:", err.message);
        }
      });
  };

  const getFloorData = () => {
    axios
      .get(`${API_BASE_URL}/getfloor`)
      .then((res) => {
        setFloors(res.data.data);
      })
      .catch((err) => {
        console.error("Error getting floors:", err);
        
        toast.error("Error getting floors")
      });
  };

  useEffect(() => {
    getFloorData();
  }, []);

  return (
    <>
      <button
        className="bg-[#4CBBA1] h-[46px] w-[165px] rounded-sm flex justify-center items-center gap-x-1 text-white font-semibold"
        onClick={() => setIsTableModal(true)}
      >
        <IoIosAddCircleOutline className="font-semibold text-lg" />
        Add Table
      </button>

      <TableModal
        title={"Add New Table"}
        isOpen={isTableModal}
        onClose={closeTableModal}
      >
        <form onSubmit={submitTable}>
          <div className="mb-4">
            <label className="block text-gray-700">Table Name</label>
            <input
              type="text"
              name="tablename"
              value={formdata.tablename}
              onChange={handleChange}
              className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Capacity</label>
            <input
              type="number"
              name="person_capicity"
              value={formdata.person_capicity}
              max={100}
              min={1}
              onChange={handleChange}
              className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Floor Select</label>
            <select
              className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              name="floorName"
              value={formdata.floorName}
              onChange={handleChange}
            >
              <option value="">Select option</option>
              {floors.map((floor, index) => (
                <option key={index} value={floor.tbfloorid}>
                  {floor.floorName}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Icon</label>
            <input
              type="file"
              name="table_icon"
              onChange={handleFile}
              className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Table
            </button>
          </div>
        </form>
      </TableModal>
    </>
  );
};

export default AddFloor;
