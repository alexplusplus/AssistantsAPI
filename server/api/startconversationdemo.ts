import OpenAI from 'openai';
import { sleep } from 'openai/core';

export default defineEventHandler(async (event) => {
    //const {words, text, replace, lang, api_key, gpt_model} = await readBody(event);
    
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const thread = await openai.beta.threads.create();
  
  await openai.beta.threads.messages.create(
    thread.id,
    {
      role: "user",
      content: "start conversation"
    }
  );
  const run = await openai.beta.threads.runs.create(
    thread.id,
    { 
      assistant_id: "asst_sxanWaCZ6nCbrXipR64D6FTe"
      //instructions: "Customized CV may be used here instead of the default one, that is hardcoded in the assistant.",
    }
  );
  
  // wait for the run to complete

  var run_status = await openai.beta.threads.runs.retrieve(
    thread.id,
    run.id
  );

  while (run_status.status != "completed" && run.status != "failed") {
    await sleep(1500);
    run_status = await openai.beta.threads.runs.retrieve(
      thread.id,
      run.id
    );
  }


  const assistants_response = await openai.beta.threads.messages.list(
    thread.id
  );
  console.log(assistants_response);
// it is necessary to return a response object that contains not only the response text, but also the thread id
  return {
      text: assistants_response.data[0].content[0].text.value,
      thread_id: thread.id,
  };

//return assistants_response.data[0].content[0].text.value;

});