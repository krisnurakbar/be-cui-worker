const { Redis } = require('@upstash/redis');
const axios = require('axios');
const { Pool } = require('pg');


const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-floral-breeze-a110e1ui.ap-southeast-1.aws.neon.tech',
  database: 'neondb',
  password: 'zGUSLys4T7rN',
  port: 5432,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});


const redis = new Redis({
  url: 'https://top-aardvark-24334.upstash.io',
  token: 'AV8OAAIjcDFlMDY4NDkxNzVlMzE0NTM2ODg2YmVkM2Q3ZDk0NTgxOHAxMA',
});


const worker = async () => {
  while (true) {
    try {
      const task = await redis.lpop('sync-tasks');


      if (!task) {
        console.log('Queue is empty, waiting for 10 seconds before retrying.');
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }


      let parsedTask;


      if (typeof task === 'string') {
        try {
          parsedTask = JSON.parse(task);
        } catch (error) {
          console.error(`Failed to parse task: ${error.message}`);
          continue;
        }
      } else {
        parsedTask = task;
      }


      await fetchAndStoreTaskData(parsedTask.cu_task_id, parsedTask.project_id, parsedTask.id);
      console.log(`Task synced ${parsedTask.task_title}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error(`Error connecting to database: ${error.message}`);
        break;
      } else {
        console.error(`An error occurred: ${error.message}`);
      }
    }
  }
};


const fetchAndStoreTaskData = async (cu_task_id, project_id, taskId) => {
  if (!cu_task_id) {
    throw new Error('Missing cu_task_id');
  }


  const url = `https://api.clickup.com/api/v2/task/${cu_task_id}`;
  const headers = {
    Authorization: "pk_60846077_JQGXG9DFNVM07G7ET0JCGASAWSO8S2YM",
    content_type: "application/json",
  };


  try {
    const response = await axios.get(url, { headers });
    const data = response.data;


    const convertEpochToDate = (epoch) => {
      return epoch ? new Date(Number(epoch)).toISOString().split('T')[0] : null;
    };


    const taskData = {
      task_title: data.name || null,
      start_date: convertEpochToDate(data.start_date),
      due_date: convertEpochToDate(data.due_date),
      actual_start_date: convertEpochToDate(data.custom_fields.find(field => field.name === "Actual Start")?.value),
      actual_end_date: convertEpochToDate(data.custom_fields.find(field => field.name === "Actual End")?.value),
      rate_card: data.custom_fields.find(field => field.name === "Rate Card")?.value || null,
      plan_cost: data.custom_fields.find(field => field.name === "Plan Cost")?.value || null,
      actual_cost: data.custom_fields.find(field => field.name === "Actual Cost")?.value || null,
      spi: data.custom_fields.find(field => field.name === "SPI")?.value || null,
      cpi: data.custom_fields.find(field => field.name === "CPI")?.value || null,
      plan_progress: data.custom_fields.find(field => field.name === "A. Progress")?.value?.percent_completed ?? null,
      actual_progress: data.custom_fields.find(field => field.name === "P. Progress")?.value?.percent_completed ?? null,
      task_status: data.status.status || null,
    };


    const updateQuery = `
      UPDATE tasks 
      SET task_title = $1, start_date = $2, due_date = $3, actual_start_date = $4, 
          actual_end_date = $5, rate_card = $6, plan_cost = $7, 
          actual_cost = $8, spi = $9, cpi = $10, actual_progress = $11, plan_progress = $12, task_status = $13
      WHERE id = $14 
      RETURNING *;
    `;


    const values = [
      taskData.task_title,
      taskData.start_date,
      taskData.due_date,
      taskData.actual_start_date,
      taskData.actual_end_date,
      taskData.rate_card,
      taskData.plan_cost,
      taskData.actual_cost,
      taskData.spi,
      taskData.cpi,
      taskData.actual_progress,
      taskData.plan_progress,
      taskData.task_status,
      taskId
    ];


    const { rows: updatedTask } = await pool.query(updateQuery, values);


    return updatedTask[0];
  } catch (error) {
    console.error('Error fetching or updating task data:', error);
    console.error('API Response:', error.response ? error.response.data : 'No response data');
    throw new Error('Failed to fetch or update task data');
  }
};


worker();