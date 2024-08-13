import '../../App.css';
import React from 'react';
import 'primereact/resources/primereact.min.css';
import "primereact/resources/themes/lara-light-indigo/theme.css";

import { Card } from 'primereact/card';

function Success() {
  return (
    <section>
      <Card>Pēc mirkļa saņemsi e-pastu ar saiti, uz kuras uzspiežot autentificēsies savā lietotnes kontā.  </Card>
    </section>
  )
}
export default Success
