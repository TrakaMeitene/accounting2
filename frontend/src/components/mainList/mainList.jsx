import React, { useEffect, useState, useRef } from "react"
import "./mainList.css"
import axios from 'axios';
import { FaMoon } from "react-icons/fa";
import { IoMdSunny } from "react-icons/io";
import { OverlayPanel } from 'primereact/overlaypanel'
import { Avatar } from 'primereact/avatar';
import { FiLogOut } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { Menu } from 'primereact/menu';

import { Toast } from 'primereact/toast';
import Profile from "../profile.jsx/profile";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import List from "./list";

export default function MainList({ user }) {
    const [mode, setMode] = useState(true)
    const op = useRef(null);
    const [picture, setPicture] = useState("")

    const toast = useRef(null);

    const router = createBrowserRouter([
        {
            path: "/",
            element: <List mode={mode} />,
        },
        {
            path: "/profile/",
            element: <Profile mode={mode} />,
        },
    ]);



    const items = [
        {
            label: 'Profils',
            icon: <CgProfile />,
            command: () => {
                window.location.replace("/profile/" + window.location.search)
            }
        },
        {
            label: 'Izrakstīties',
            icon: <FiLogOut />,
            command: () => {
                handleLogout()
            }
        }
    ];

    useEffect(() => {
        if (mode) {
            document.body.style.backgroundColor = "hsl(233, 30%, 11%)"
            // document.getElementById("page").style.backgroundColor = "hsl(236, 30%, 17%)"
        } else {
            document.body.style.backgroundColor = "hsl(252, 45%, 98%)"
            // document.getElementById("page").style.backgroundColor = "hsl(252, 45%, 98%)"

        }
        getuser()
    }, [mode])

    const getuser = () => {
        axios.get("http://localhost:3300/user", { withCredentials: true })
            .then(response => setPicture(response.data))
    }

    const modechange = () => {
        setMode(!mode)
    }



    const handleLogout = () => {
        axios.get("http://localhost:3300/logout", { withCredentials: true })
            .then(response => window.location.replace("/")
            )
    }

    return (
        <>
            <Toast ref={toast} />

            <section>

                <div className="leftContainer">
                    <div className="image">
                        "test"
                    </div>
                    <div className="moon" onClick={modechange}>{mode === true ? <FaMoon color="white" size={20} /> : <IoMdSunny color="white" size={20} />}</div>
                    <Avatar image={picture} className="mr-2 signout" size="large" shape="circle" onClick={(e) => op.current.toggle(e)} />
                    <OverlayPanel ref={op}>
                        <Menu model={items} />
                    </OverlayPanel>

                </div>
                <RouterProvider router={router} />
            </section>
        </>

    )
}