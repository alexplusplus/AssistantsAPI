import OpenAI from 'openai';
import { sleep } from 'openai/core';

export default defineEventHandler(async (event) => {
    const {thread_id, text_input} = await readBody(event);
    
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  await openai.beta.threads.messages.create(
    thread_id,
    {
      role: "user",
      content: text_input,
    }
  );
  const run = await openai.beta.threads.runs.create(
    thread_id,
    { 
      assistant_id: "asst_sxanWaCZ6nCbrXipR64D6FTe"
      //instructions: "Customized CV may be used here instead of the default one, that is hardcoded in the assistant.",
    }
  );
  
  // wait for the run to complete

  var run_status = await openai.beta.threads.runs.retrieve(
    thread_id,
    run.id
  );

  while (run_status.status != "completed" && run.status != "failed") {
    await sleep(1500);
    run_status = await openai.beta.threads.runs.retrieve(
      thread_id,
      run.id
    );
  }


  const assistants_response = await openai.beta.threads.messages.list(
    thread_id
  );

  return assistants_response.data[0].content[0].text.value;

});