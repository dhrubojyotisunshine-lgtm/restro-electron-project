import React from 'react'

const OrderButton = (props) => {
  return (
    <button className=' h-[51px] w-[146px]  bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md   cursor-pointer  px-7 py-3'>{props.children}</button>
  )
}
export default OrderButton