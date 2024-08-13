import React, { useEffect } from "react";
import logo from "../../assets/rplogo.png"

export default function Errorpage({mode}) {

    useEffect(()=>{
        if (mode) {
            document.body.style.backgroundColor = "hsl(233, 30%, 11%)"
        } else {
            document.body.style.backgroundColor = "hsl(252, 45%, 98%)"
        }
    })
    return (
        <setion id="home">
            <img src={logo} alt="rēķini pats"/>
           <span className={mode ? "text" : "text black"}> Lapa, kuru meklēji neeksistē</span>
           </setion>
    )
}