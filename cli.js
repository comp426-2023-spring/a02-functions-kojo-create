#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fetch = require('node-fetch')
const moment = require('moment-timezone')

const options = yargs(hideBin(process.argv))
  .usage('Usage: galosh.js [options] -[n|s] LATITUDE -[e|w] LONGITUDE -z TIME_ZONE')
  .option('help', { alias: 'h', describe: 'Show this help message and exit.', type: 'boolean' })
  .option('latitude-north', { alias: 'n', describe: 'Latitude: N positive.', type: 'number' })
  .option('latitude-south', { alias: 's', describe: 'Latitude: S negative.', type: 'number' })
  .option('longitude-east', { alias: 'e', describe: 'Longitude: E positive.', type: 'number' })
  .option('longitude-west', { alias: 'w', describe: 'Longitude: W negative.', type: 'number' })
  .option('timezone', { alias: 'z', describe: 'Time zone: uses tz.guess() from moment-timezone by default.', type: 'string' })
  .option('day', { alias: 'd', describe: 'Day to retrieve weather: 0 is today; defaults to 1.', type: 'number', default: 1 })
  .option('json', { alias: 'j', describe: 'Echo pretty JSON from open-meteo API and exit.', type: 'boolean' })
  .check((argv, options) => {
    if ((argv.n && argv.s) || (!argv.n && !argv.s)) {
      throw new Error('Please provide one latitude argument: either north (n) or south (s).')
    }
    if ((argv.e && argv.w) || (!argv.e && !argv.w)) {
      throw new Error('Please provide one longitude argument: either east (e) or west (w).')
    }
    return true
  })
  .argv

if (options.help) {
  console.log(options.usage)
  process.exit(0)
}

const latitude = options.n || -options.s
const longitude = options.e || -options.w
const timezone = options.timezone || moment.tz.guess()
const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=precipitation_hours`

fetch(url)
  .then(response => response.json())
  .then(data => {
    const precipitationHours = data.daily.precipitation_hours
    const days = options.day
    const hasPrecipitation = precipitationHours[days] > 0
    let message = `It should be ${hasPrecipitation ? 'rainy' : 'sunny'}`
    if (days === 0) {
      message += ' today.'
    } else if (days === 1) {
      message += ' tomorrow.'
    } else {
      message += ` in ${days} days.`
    }
    if (options.json) {
      console.log(JSON.stringify(data, null, 2))
    } else {
      console.log(message)
    }
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
