
const timeframeResponseMock =
  {
    status: 1,
    message: "mocking timetable",
    payload:
      {
        settings :
          {
            showWeekend: false
          },
        sections :
          [
            {
              section: {
                id: "1",
                name : "Kurszeitraum 1"
              },
              defaultDate: "2021-01-01T22:00:00.000000Z",
              endDate: "2021-06-30T00:00:00.000000Z",
              startDate: "2021-01-01T22:00:00.000000Z"
            },
            {
              section: {
                id: "2",
                name : "Kurszeitraum 2"
              },
              defaultDate: "2021-01-07T22:00:00.000000Z",
              endDate: "2021-12-31T22:00:00.000000Z",
              startDate: "2021-07-01T00:00:00.000000Z"
            }
          ]
      }
  }


const createEvents = () =>
{
  const moment = require("moment")
  return Array.from(Array(365).keys()).map( i => {
    let start = moment("2021-01-01T07:30:00.000000Z").add(i, "days").add((Math.random() * 2), "hours")
    let end = start.clone().add(1.5+(Math.random() * 5), "hours")
    let rnd1 =  Math.random() > 0.5
    return (
      {
        editable: false,
        display: "",
        title: "A mocked Event",
        dozent : Math.random() > 0.5 ? "Frau Müller" : "Herr Meier",
        raum :Math.random()? "Raum A" : "Halle B",
        color: rnd1> 0.5 ? "#0054bd" : "#c3ffa9",
        start: start.toISOString(),
        end: end.toISOString(),
        type: "vacation",
        eventTextColor: rnd1 > 0.5 ? "#ffffff" : "#000000"
      })
  })
}



const teachingResponseMock =
  {
    status: 1,
    message: "mocking teaching",
    payload:
      {
        events :   createEvents()
      }
  }



class Mock {
  middleware () {
    const router = require('koa-route')
    return [

      router.get('/administration/timetable/timeframe', function (ctx) {
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Content-Type, Accept');
        ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        ctx.set('Access-Control-Allow-Credentials', 'true');
        ctx.set('Vary', 'Origin');
        ctx.response.type = 'json'
        ctx.response.body = timeframeResponseMock
      }),

      router.get('/administration/timetable/teaching', function (ctx) {
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Content-Type, Accept');
        ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        ctx.set('Access-Control-Allow-Credentials', 'true');
        ctx.set('Vary', 'Origin');
        ctx.response.type = 'json'
        ctx.response.body = teachingResponseMock
      }),

    ]
  }
}

module.exports = Mock
