import React from "react";
import "./landing.css"
import logo from "../../assets/rplogopurple.png"
import { Button } from 'primereact/button';
import { FaHandHoldingHand, FaHeart } from "react-icons/fa6";
import firstblock from "../../assets/block1.png"
import secondblock from "../../assets/block2.png"
import thirdblock from "../../assets/block3.png"

export default function Landing() {

    return (
        <>
            <section id="home">
                <nav>
                    <img src={logo} alt="Rēķini pats " width="100px" />
                    <a href="/login">  <Button type="button" outlined>PIESLĒGTIES</Button></a>
                </nav>
                <h1> IZVEIDO <span className="gradient">RĒĶINU</span>, LEJUPIELĀDĒ, UZGLABĀ!</h1>
                <p>Ērtākais rīks pašnodarbinātajiem rēķinu izrakstīšanai un uzglabāšanai!</p>
                <a href="/login"> <Button type="button" severity="primary" >PIESLĒGTIES</Button></a>

            </section>
            <section id="about">
                <h2>Ar ko mēs atšķiramies no citiem?</h2>
                <div className="aboutboxes">
                    <div className="container">
                        <FaHeart size={30} />

                        <h3>Bezmaksas alternatīva</h3>
                        <p>Izraksti, lejupielādē un uzglabā bez skaita ierobežojuma un pilnīgi bez maksas.</p>
                    </div>
                    <div className="container">
                        <FaHandHoldingHand size={30} />

                        <h3>No pašnodarbinātā pašnodarbinātajam</h3>
                        <p>Pievienojies kopienai, sniedz atsauksmi un palīdzi papildināt funkcionalitāti. </p>
                    </div>

                </div>
            </section>
            <section id="how">
                <h2>Kā tas strādā?</h2>
                <div className="aboutboxes2">
                    <div className="container">
                        <h3>Aizpildi profila informāciju</h3>
                        <img src={firstblock} width="80%" style={{border: "1px solid gray"}}/>
                    </div>
                    <div className="container" >
                        <h3>Izveido rēķinu</h3>
                        <img src={secondblock} width="80%" style={{border: "1px solid gray"}}/>
                    </div>
                    <div className="container" >
                        <h3>Uzglabā un jelupielādē</h3>
                        <img src={thirdblock} width="80%" style={{border: "1px solid gray"}}/>
                    </div>
                </div>
            </section>
            <footer>
                <p>Izstrādāja <a href="https://frogit.lv">Frogit</a> ar ❤️ 2024</p>
            </footer>
        </>
    )
}