// License: MIT
// Copyright Digital Learning GmbH

import React, {useEffect, useRef, useState} from 'react'
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import {Button, Tab, Tabs} from "react-bootstrap";
import {EducaLoading} from "./EducaLoading";
import DatePicker from 'react-datepicker'
import moment from "moment";
import "react-bootstrap"
import 'bootstrap/dist/css/bootstrap.min.css';
import PropTypes from 'prop-types';
import "react-datepicker/dist/react-datepicker.css"
import "@fortawesome/fontawesome-free/css/all.css"

const EDIT_PLAN_TIME_FRAME_DAYS = 45


/*
  Ajax Calls
 */

const concatParams = (params = {}) => {
  let retString = ""
  let keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    if (i === 0) // init
      retString = "?"
    else
      retString += "&"
    retString += encodeURIComponent(keys[i]) + "=" + encodeURIComponent(params[keys[i]])
  }
  return retString
}


const getTimetableTimeFrame = (basePath, token, entityType, entityId) =>
{
  return _get(basePath+concatParams({foreign_id : entityId, type : entityType}), token)
}

const getTimetable = (basePath, token, entityType, entityId, startUnix, endUnix) =>
{
    return _get(basePath+ concatParams({foreign_id : entityId, type : entityType, startUnix : startUnix, endUnix : endUnix}), token)
}
const _get = (path, token) =>
{
  return fetch(path, {
    method: "GET",
    headers:
      {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': "Bearer " + token
      },
  })
    .then(resp => resp.json())
}


const StuPla = ({
                  //required
                  entityId,
                  entityType,
                  apiToken,
                  baseUrl,

                  //Texts
                  noEntityLoadedComponent,

                  //Callbacks
                  sectionChangedCallback,
                  reloadCallback,
                  errorCallback,

                  //AJAX
                  pathTimeFrame,
                  pathTeaching
                }) => {
  const [calendarTimeFrame, setCalendarTimeframe] = useState({
    start: 0,
    end: 0
  })

  const [lastCalendarTimeFrame, setLastCalendarTimeframe] = useState({
    start: -1,
    end: -1
  })

  const [sevenDayWeek, setSevenDayWeek] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sections, setSections] = useState([])
  const [events, setEvents] = useState([])
  const [currentSection, setCurrentSectionState] = useState(null)
  const calendarRef = useRef()

  const getPath = () =>
  {
    if (!baseUrl)
    {
      errorCallback("base URL not defined.")
      return undefined
    }
    if (!apiToken)
    {
      errorCallback("API Token not defined.")
      return undefined
    }

    //remove trailing slash
   return baseUrl.lastIndexOf("/") === baseUrl.length - 1 ? baseUrl.substr(0, baseUrl.length - 1) : baseUrl
  }


  useEffect(() => {
    if (entityId && entityType) {
      getTimeFrame()
    }
  }, [entityId, entityType])

  useEffect(() => {

    if (entityId)
    {
      setCurrentSection(null)
      setEvents([])
      setSections([])
    }
  }, [entityId])


  useEffect(() => {
    loadLessons()
  }, [calendarTimeFrame])

  const setCurrentSection = (val) => {
    setCurrentSectionState(val)
    if (sectionChangedCallback) sectionChangedCallback(val)
  }

  const getTimeFrame = () => {
    let path = getPath();
    if(!path)
      return errorCallback("baseURL is not defined")
    getTimetableTimeFrame(
      path+"/"+pathTimeFrame,
      apiToken,
      entityType,
      entityId,
    )
      .then((resp) => {
        if (resp.status > 0 && resp?.payload?.settings) {
          setSevenDayWeek(!!resp?.payload?.settings?.showWeekend)
        }
        if (resp.status > 0 && resp?.payload?.sections?.length > 0) {
          setSections(resp.payload.sections)
          const now = moment().unix()
          let indexFound = null
          const sctns = JSON.parse(JSON.stringify(resp.payload.sections))
          sctns.forEach(
            (s, i) =>
              (indexFound =
                moment(s.startDate).unix() < now &&
                moment(s.endDate).unix() > now
                  ? i
                  : indexFound)
          )
          let sectionToSet = indexFound != null ? sctns[indexFound] : null
          if (!sectionToSet) {
            sctns.sort((a, b) => {
              if (
                Math.abs(moment(a.startDate).unix() - now) >
                Math.abs(moment(b.startDate).unix() - now)
              )
                return 1
              return -1
            })
            sectionToSet = sctns[0]
            if (moment(sectionToSet.startDate).unix() < now && sctns.length > 1)
              sectionToSet = sctns[1]
          }

          setCurrentSection(sectionToSet)
          setCalendarTimeframe({
            start: calendarTimeFrame.start - 1,
            end: calendarTimeFrame.end - 1
          })
          return
        }
        throw new Error(resp.message)
      })
      .catch((err) => {
        errorCallback( 'Die Abschnitte des Stundenplans konnten nicht geladen werden.' + err.message)
      })
  }

  const loadLessons = (force) => {
    if (!entityId|| !entityType || !currentSection) return

    if (!force) {
      if (
        calendarTimeFrame.start <= 0 ||
        calendarTimeFrame.end <= 0 ||
        lastCalendarTimeFrame.start === calendarTimeFrame.start ||
        lastCalendarTimeFrame.end === calendarTimeFrame.end
      )
        return
    }
    if (reloadCallback) reloadCallback()
    setIsLoading(true)

    let path = getPath();
    if(!path)
      return errorCallback("baseURL is not defined")

    getTimetable(
      path+"/"+pathTeaching,
      apiToken,
      entityType,
      entityId,
      calendarTimeFrame.start,
      calendarTimeFrame.end
    )
      .then((resp) => {
        if (resp.status > 0 && resp?.payload?.events) {
          setLastCalendarTimeframe(calendarTimeFrame)
          setEvents(resp?.payload?.events)
          return
        }
        throw new Error(resp.message)
      })
      .catch((err) => {
        errorCallback("Die Abschnitte des Stundenplans konnten nicht geladen werden." + err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  /**
   * Lessonplans
   */
  const eventRender = (arg, element, view) => {
    if (arg.event.display === 'background')
      return <BreakContent event={arg.event} />
    return (
      <LessonContent
        section={currentSection}
        event={arg.event}
        reloadCallback={() => loadLessons(true)}
      />
    )
  }

  /**
   * Called whenever a user navigates through the calendar
   * @param dateSet
   */
  const onDateSetsChanged = (dateSet) => {
    let newEndDate = null
    let newStartDate = null

    if (
      moment(dateSet.end).unix() - calendarTimeFrame.end > 0 ||
      calendarTimeFrame.start - moment(dateSet.start).unix() > 0
    ) {
      newEndDate = moment(dateSet.startStr)
        .add(EDIT_PLAN_TIME_FRAME_DAYS, 'days')
        .unix()
      newStartDate = moment(dateSet.startStr)
        .subtract(EDIT_PLAN_TIME_FRAME_DAYS, 'days')
        .unix()
      setCalendarTimeframe({ start: newStartDate, end: newEndDate })
    }
  }

  const fullCalendar = (
    <FullCalendar
      ref={calendarRef}
      editable={false}
      selectable={false}
      eventResourceEditable={false}
      eventDurationEditable={false}
      droppable={false}
      headerToolbar={{
        start: 'title',
        end: 'dayGridMonth,timeGridWeek,timeGridWeek5Days,timeGridDay todayCustom,prev,next'
      }}
      plugins={[
        dayGridPlugin,
        timeGridPlugin
      ]}
      initialView={sevenDayWeek
        ? 'timeGridWeek'
        : 'timeGridWeek5Days'}
      validRange={{
        start: currentSection?.startDate,
        end: currentSection?.endDate
      }}
      firstDay={1}
      slotMinTime='07:30:00'
      slotMaxTime='18:00:00'
      slotDuration='00:15:00'
      snapDuration='00:05:00'
      themeSystem='bootstrap'
      contentHeight='auto'
      locale='de'
      datesSet={(datesSet) => {
        onDateSetsChanged(datesSet)
      }}
      eventContent={eventRender}
      customButtons={{
        todayCustom: {
          text: 'Heute',
          click(ev, element) {
            calendarRef.current?.getApi()?.today()
          }
        }
      }}
      buttonText={{
        month: 'Monat',
        week: '7-Tage',
        timeGridWeek5Days: '5-Tage',
        day: 'Tag',
        list: 'Liste'
      }}
      views={{
        timeGridWeek5Days: {
          type: 'timeGridWeek',
          hiddenDays: [0, 6]
        }
      }}
      weekNumbers
      events={events || []}
    />
  )

  const tabsWidget = (
    <div style={{ position: 'relative' }}>
      {isLoading ? (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 999999,
            backgroundColor: 'rgba(0,0,0,0.05)',
            marginTop: '-10px'
          }}
        >
          <EducaLoading />
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginBottom: '-35px'
        }}
      >
        <DatePicker
          locale='de-DE'
          popperPlacement='left-start'
          showWeekNumbers
          onChange={(date) => calendarRef?.current?.getApi().gotoDate(date)}
          customInput={
            <Button variant='primary'>
              <i className='fas fa-calendar-alt' />
            </Button>
          }
        />
      </div>

       <Tabs
          onSelect={(k) =>
          setCurrentSection(sections.find((s) => s.section.id == k))}
          activeKey={currentSection?.section.id}
        >
          {sections.map((section) => {
            return (
              <Tab
                key={section.section.id}
                eventKey={section.section.id}
                title={
                  section.section.name +
                  ' (' +
                  moment(section.startDate).format('DD.MM.') +
                  ' - ' +
                  moment(section.endDate).format('DD.MM.') +
                  ')'
                }
              >
                <div style={{ marginTop: '15px' }} />
              </Tab>
            )
          })}
        </Tabs>
      {fullCalendar}
    </div>
  )

  return (
    <div>
        {!isLoading &&
        sections?.length === 0 || !entityId? (
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <h5>{noEntityLoadedComponent}</h5>
          </div>
        ) :
          tabsWidget
        }
    </div>
  )
}

const LessonContent = (props) => {
  const evt = props.event?._def
  const range = props.event?._instance?.range
  if (!evt || !range) return 'Ein Fehler ist aufgetreten'

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: evt?.extendedProps.eventTextColor
      }}
    >
      <h6 style={{ marginBottom: '0px' }}>
        <b>{evt.title}</b>
        <div style={{ fontSize: '0.8em', float: 'right' }}>
          {moment(range.start).utc().format('HH:mm')} -{' '}
          {moment(range.end).utc().format('HH:mm')}
        </div>
      </h6>
      <i>{evt?.extendedProps?.subtitle}</i>
      {evt?.extendedProps?.dozent?.length > 0 ? (
        <i
          style={{
            fontSize: '0.75em',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <i className='fa fa-user-tie mr-1' />
          {evt?.extendedProps?.dozent}
        </i>
      ) : null}
      {evt?.extendedProps?.raum?.length > 0 ? (
        <i
          style={{
            fontSize: '0.75em',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <i className='fa fa-home mr-1' />
          {evt?.extendedProps?.raum}
        </i>
      ) : null}
      {evt?.extendedProps?.klassen_name?.length > 0 ? (
        <i
          style={{
            fontSize: '0.75em',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <i className='fa fa-users mr-1' />
          {evt?.extendedProps?.klassen_name.join(', ')}
        </i>
      ) : null}
    </div>
  )
    return content

}

const BreakContent = (props) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <p className='text-muted m-1'>{props.event.title}</p>{' '}
    </div>
  )
}


StuPla.propTypes = {
  apiToken : PropTypes.string.isRequired,
  baseUrl : PropTypes.string.isRequired,
  entityId : PropTypes.number.isRequired,
  entityType : PropTypes.oneOf(['schoolclass', 'teacher', 'room', 'student']).isRequired,

  noEntityLoadedComponent : PropTypes.oneOfType([PropTypes.element, PropTypes.string]),

  sectionChangedCallback : PropTypes.func,
  reloadCallback : PropTypes.func,
  errorCallback : PropTypes.func,

  //Ajax
  pathTimeFrame : PropTypes.string,
  pathTeaching : PropTypes.string,
};

StuPla.defaultProps = {
  noEntityLoadedComponent: 'Die Termine konnten nicht geladen werden.',
  errorCallback : (msg) => {console.error(msg)}, // channel to err

  pathTimeFrame : "rios/timetable/timeframe",
  pathTeaching : "rios/timetable"
};

export default StuPla
