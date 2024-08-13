import React, { useState } from "react";
import "./landing.css"
import logo from "../../assets/rplogo.png"
import { Button } from 'primereact/button';
import { FaHandHoldingHand,FaHeart} from "react-icons/fa6";

export default function Landing() {

    return (
        <>
            <section id="home">
                <nav>
                    <img src={logo} alt="Rēķini pats " width="100px" />
                    <Button type="button" outlined>PIESLĒGTIES</Button>
                </nav>
                <h1> IZVEIDO <span className="gradient">RĒĶINU</span>, LEJUPIELĀDĒ, UZGLABĀ!</h1>
                <p>Ērtākais rīks pašnodarbinātajiem rēķinu izrakstīšanai un uzglabāšanai!</p>
              <a href="/login"> <Button type="button" severity="primary" >PIESLĒGTIES</Button></a>

            </section>
            <section id="about">
                <h2>Ar ko mēs atšķiramies no citiem?</h2>
                <div className="aboutboxes">
                    <div className="container">
                        <FaHeart size={30}/>

                        <h3>Bezmaksas alternatīva</h3>
                        <p>Izraksti, lejuplādē un uzglabā bez skaita ierobežojuma un pilnīgi bez maksas.</p>
                    </div>
                    <div className="container">
                    <FaHandHoldingHand size={30}/>

                        <h3>No pašnodarbinātā pašnodarbinātajam</h3>
                        <p>Pievienojies kopienai, sniedz atsauksmi un palīdzi papildināt funkcionalitāti. </p>
                    </div>
            
                </div>
            </section>
            <footer>
                <p>Izstrādāja <a href="https://frogit.lv">Frogit</a> ar ❤️ 2024</p> 
            </footer>
        </>
    )
}