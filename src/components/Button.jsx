import React from 'react'

const Button = (props) => {
  return (
    <button className='  hover:bg-[#4cddA1]  bg-[#0f044a] text-[#fff] border-[2px] border-zinc-300 rounded-xl cursor-pointer  px-7 py-3'>{props.children}</button>
  )
}

export default Button