import React from 'react'

import StuPla from 'stupla-stundenplan'
import 'stupla-stundenplan/dist/index.css'

const App = () => {

  return<>
    <div style={{display: "flex", flex: 1, justifyContent: "center"}}>
    <div style={{
      width: "1400px",
    //  height: "800px",
      marginTop: "50px",
      marginBottom: "50px",
      overflowY: "auto",
      padding: "10px",
     // border: "1px solid gray",
    }}>
      <h4>Stundenplanung</h4>
      <div>

        <StuPla
          entityId={1}
          entityType={"teacher"}
          apiToken={"THISISAVALIDAPIKEY"}
          baseUrl={"http://localhost:8000"}
        /></div>
    </div>
  </div>
  </>
}

export default App
