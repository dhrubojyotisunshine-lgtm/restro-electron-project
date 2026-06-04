import React from 'react'

const EmployeePreview = ({ isOpen, onClose, invoiceDatas}) => {
    if (!isOpen) return null;
  if (!invoiceDatas || invoiceDatas.length === 0) {
    return <div>Loading...</div>;
  }
  const employeeData = invoiceDatas[0].data;
  return (
    <div>
    <div className="justify-center  flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none ">
      <div className=" w-full  px-20 ">
        <div className=" py-4  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
          <div className="flex  py-5 px-4 justify-between items-center ">
            <span></span>
            <button
              onClick={onClose}
              className="text-white bg-[#FB3F3F] px-2  rounded-md hover:scale-105 font-bold"
            >
              X
            </button>
          </div>
          <div className="">
          <div className="w-full bg-white p-6">
  <h1 className="text-2xl font-semibold mb-4">More About The Employee</h1>
  
  <table className="min-w-full border border-gray-300">
    <tbody>
      <tr>
        <td className=" border border-[#4CBBA1] px-4 py-2 text-center font-semibold">City</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].city ? employeeData[0].city:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Country</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].country ? employeeData[0].country:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Designation</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].designation_name ? employeeData[0].designation_name:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Division</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].division_name ? employeeData[0].division_name:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">DOB</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{new Date(employeeData[0].dob).toLocaleDateString()  ? new Date(employeeData[0].dob).toLocaleDateString() :"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Duty Type</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].duty_typename ? employeeData[0].duty_typename:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Email</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].email ? employeeData[0].email:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Emergency Contact</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].emerg_contct ? employeeData[0].emerg_contct:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Phone</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].phone ? employeeData[0].phone:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Gender</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].gender_name ? employeeData[0].gender_name:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Marital Status</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].marital_sta ? employeeData[0].marital_sta:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Hire Date</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{new Date(employeeData[0].hire_date).toLocaleDateString() ? new Date(employeeData[0].hire_date).toLocaleDateString():"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Rehire Date</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{new Date(employeeData[0].rehire_date).toLocaleDateString() ? new Date(employeeData[0].rehire_date).toLocaleDateString():"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">State</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].state ? employeeData[0].state:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Zip</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].zip ? employeeData[0].zip:"No data found"}</td>
      </tr>
      <tr>
        <td className="border border-[#4CBBA1] px-4 py-2 text-center font-semibold">Termination Reason</td>
        <td className="border border-[#4CBBA1] text-center px-4 py-2">{employeeData[0].termination_reason ? employeeData[0].termination_reason:"No data found"}</td>
      </tr>
      {/* Add additional rows for other fields as needed */}
    </tbody>
  </table>
</div>

</div>
        </div>
      </div>
    </div>
    <div className=" opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
  </div>
  )
}

export default EmployeePreview
