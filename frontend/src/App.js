import './App.css';
import React, { useEffect, useState } from 'react';
import Landing from './components/landing/langing.jsx';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Login from './components/createForm/success.jsx';
import MainList from './components/mainList/mainList.jsx';
import Signin from './signin.jsx';
import Profile from './components/profile/profile.jsx';
import Errorpage from './components/errorpage/errorpage.jsx';

function App() {

  const router = createBrowserRouter([
    {
      path: "*",
      element: <Errorpage/>
    },
    {
      path: "/login",
      element: (<Signin/>),
      errorElement: <Errorpage/>
    },
    {
      path: "/",
      element: (<Landing />),
      errorElement: <Errorpage/>,
    },
    {
      path: "/list/",
      element: (<MainList/>),
      errorElement: <Errorpage/>
    },
    {
      path: "/profile/",
      element: (<MainList/>),
      errorElement: <Errorpage/>
    },
  ])

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}
export default App
