
import React, {useEffect, useState} from "react";
import axios from 'axios';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { FaEnvelope } from "react-icons/fa";
import { Card } from 'primereact/card';
import { CiFacebook } from "react-icons/ci";
import logo from "./assets/rplogopurple.png"
import Success from "./components/createForm/success";

export default function Signin(){

  const [value, setValue] = useState("")
  const [success, setSuccess] = useState(false)

    const query = new URLSearchParams(window.location.search);
    const token = query.get('t')
    const code = query.get("code")
  

    useEffect(()=>{
   check()
    }, [])

    const check =()=>{
        axios.get(process.env.REACT_APP_API_URL + "/check", { withCredentials: true })
        .then((response) => {
            if(response.data.message){
          window.location.replace("/list/")
            }
        }
        )
    }

    const signin = (e) => {
      e.preventDefault()
      const data = { "email": value }
  
      axios.post(process.env.REACT_APP_API_URL+ "/sign", data, { withCredentials: true })
        .then(response => {
          if (response.data.message === "success") {
            setSuccess(true)
          }
        })
    }
  
  
    const socauth = () => {
      axios.post(process.env.REACT_APP_API_URL+ "/social")
        .then((response) => {
          window.location.replace(response.data)
        }
        )
    }
  
 

    return(
        <>
       {success ? <Success/> : <section>
        <div className='card'>
         <img src={logo} width={300} height="auto"/>
          <form onSubmit={signin} style={{marginTop:20 }}>
          <span className="p-float-label p-input-icon-right email">
            <FaEnvelope />
            <InputText id="email" className='email' value={value} onChange={(e) => setValue(e.target.value)} />
            <label htmlFor="email">Epasts*</label>
          </span>
          <Button type="submit" label="Apstiprināt" className="mt-2 submit" />
  
        </form>        
      <span className='line'><hr/></span> 
          <Button onClick={socauth} label="turpināt ar Facebook" className='soc' ><CiFacebook size={25} /></Button>
          </div>
          </section>}
          </>
    )
}