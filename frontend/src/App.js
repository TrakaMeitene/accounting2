import './App.css';
import React, { useEffect, useState } from 'react';
import MainList from './components/mainList/mainList.jsx';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.min.css';
import "primereact/resources/themes/lara-light-indigo/theme.css";

import axios from 'axios';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { FaEnvelope } from "react-icons/fa";
import { Card } from 'primereact/card';
import { CiFacebook } from "react-icons/ci";
import logo from "./assets/logo.png"

function App() {

  const [signedin, setSigned] = useState(false)
  const [value, setValue] = useState("")
  const [success, setSuccess] = useState(false)

  const query = new URLSearchParams(window.location.search);
  const token = query.get('t')
  const code = query.get("code")


  useEffect(() => {
    if (token !== null) {
      verify()
    }
    if (code !== null) {
      socverify()
    }
    // eslint-disable-next-line
  }, [token, code])


  const signin = (e) => {
    e.preventDefault()
    const data = { "email": value }

    axios.post("http://localhost:3300/sign", data, { withCredentials: true })
      .then(response => {
        if (response.data.message === "success") {
          setSuccess(true)
        }
      })
  }

  const verify = () => {
    const data = { "token": token, "email": value }

    axios.post("http://localhost:3300/verify", data, { withCredentials: true })
      .then(response => setSigned(true))
  }

  const socauth = () => {
    axios.post("http://localhost:3300/social")
      .then((response) => {
        window.location.replace(response.data)
      }
      )
  }

  const socverify = () => {
    const data = { "code": code }
    axios.post("http://localhost:3300/socverify", data, { withCredentials: true })
      .then((response) => {
        setSigned(true)
      })
  }


  return (
    <>

      {(!signedin & !success) ? <div className='card'>
        <img src={logo} width={300} height={150}/>
        <form onSubmit={signin} >
        <span className="p-float-label p-input-icon-right email">
          <FaEnvelope />
          <InputText id="email" className='email' value={value} onChange={(e) => setValue(e.target.value)} />
          <label htmlFor="email">Epasts*</label>
        </span>
        <Button type="submit" label="Apstiprināt" className="mt-2 submit" />

      </form>        
    <span className='line'><hr/></span> 
        <Button onClick={socauth} label="turpināt ar Facebook" className='soc' ><CiFacebook size={25} /></Button></div>
        : <div/>
        }

      {success && <Card>Pēc mirkļa saņemsi e-pastu ar saiti, uz kuras uzspiežot autentificēsies savā lietotnes kontā.  </Card>}

      {signedin && <PrimeReactProvider>
        <div>
          <MainList />
        </div>
      </PrimeReactProvider>}

    </>
  )
}
export default App
