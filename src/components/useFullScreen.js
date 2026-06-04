import { useState } from "react";

import React from 'react'

const useFullScreen = () => {

    const [isFullScreen, setIsFullScreen] = useState(false);

    const toggleFullScreen = () => {
        if (!isFullScreen) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
        setIsFullScreen(!isFullScreen);
      };
    
      return { isFullScreen, toggleFullScreen };
  
  
  
}

export default useFullScreen
