<template>
    <div class="flex justify-center">
    <div class="p-4 flex flex-col gap-3 w-2/3">
      <p class="text-lg">UI for OpenAI Assistant</p>
    <div class="divider divider-neutral">Settings</div>
  
    <div class="flex content-center items-center place-content-evenly flex-row gap-2">
      <div class="form-control">
    <label class="label cursor-pointer">
      <span class="label-text">Demo: {{demo ? 'ON':'OFF'}} &nbsp;</span>
      <input v-model="demo" type="checkbox" class="toggle" />
    </label>
  </div>
      <label class="form-control w-full max-w-xs">
    <div class="label">
      <span class="label-text">OpenAI API Key</span>
    </div>
      <input v-model="apiKey" type="text" placeholder="Type key here" class="input input-bordered w-full max-w-xs" :disabled="demo"/>
    </label>
    <label class="form-control w-full max-w-xs">
    <div class="label">
      <span class="label-text">Assistant ID</span>
    </div>
      <input v-model="assistantId" type="text" placeholder="Type ID here" class="input input-bordered w-full max-w-xs" :disabled="demo" />
    </label>
    </div>
  
    <div class="divider divider-neutral">Assistant</div>
      <div v-if="apiRequestInProgress">
        Loading...
      </div>
      <div v-else><button class="btn btn-primary w-12" @click="StartConversation()">Start</button></div>
      <p>{{ WelcomeMessage }}</p>
      <div v-if="WelcomeMessage">
        <textarea v-model="MainInput" placeholder="Description" class="textarea textarea-bordered textarea-sm w-full" ></textarea>
        <br>
        <div v-if="MainMessage.length==0 || MainMessage.length>20">
          <button class="btn btn-primary" @click="GenerateResult( MainInput )">Generate</button>
        </div>
      </div>
      {{ MainMessage }}
      <div v-if="MainMessage.length>20">
        <button class="btn btn-primary" @click="ResetAll()">Reset</button>
      </div>
  </div> </div>
  </template>
  
  <script setup>
  import { useFetch } from '@vueuse/core';
  const demo = ref(false);
  const apiRequestInProgress = ref(false); //var is used to display "Loading" while the request is in progress in StartConversation() and GenerateResult()
  const WelcomeMessage = ref('');
  const MainInput = ref('');
  const MainMessage = ref('');
  const threadId = ref('');
  import OpenAI from 'openai';
  import { sleep } from 'openai/core';
  const apiKey = ref('');
  const assistantId = ref(''); 
  const openai = ref();
  
  async function StartConversation () {
    apiRequestInProgress.value = true;
    WelcomeMessage.value = "";
    MainMessage.value = "";
    
    if (demo.value){ 
      const {data:WelcomeResponse} = await useFetch('api/startconversationdemo').get().json();
      threadId.value = WelcomeResponse.value.thread_id;
      WelcomeMessage.value = WelcomeResponse.value.text;
    }
  
    else{
    openai.value = new OpenAI({
      apiKey: apiKey.value,
      dangerouslyAllowBrowser: true,
    });
  
    const thread = await openai.value.beta.threads.create();
    await openai.value.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: "start conversation"
      }
    );
    const run = await openai.value.beta.threads.runs.create(
      thread.id,
      { 
        assistant_id: assistantId.value,
        //instructions: "Customized CV may be used here instead of the default one, that is hardcoded in the assistant.",
      }
    );
    
    // wait for the run to complete
    const timeStart = Date.now();
    const duration = ref(0);
  
    const run_status = ref(await openai.value.beta.threads.runs.retrieve(
      thread.id,
      run.id
    ));
  
    while (run_status.value.status != "completed" && run.status != "failed") {
      await sleep(1500);
      run_status.value = await openai.value.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      duration.value = Date.now() - timeStart;
      console.log(run_status.value.status);
      console.log(duration.value);
    }
  
  
    const assistants_response = await openai.value.beta.threads.messages.list(
      thread.id
    );
    threadId.value = thread.id; // save thread id as a global var for later use in the second function
    WelcomeMessage.value = assistants_response.data[0].content[0].text.value;
  } // end of else Demo=False
    apiRequestInProgress.value = false;
  }
  
  async function GenerateResult(textInputForAI){
    apiRequestInProgress.value = true;
    MainMessage.value = "Loading...";
  
    if (demo.value){
      const {data:MainResponse} = await useFetch('api/generateresultdemo').post({ thread_id: threadId.value, text_input: textInputForAI }).text();
      MainMessage.value = MainResponse.value;
    }
  
    else{
  
    await openai.value.beta.threads.messages.create(
    threadId.value,
    {
      role: "user",
      content: textInputForAI
    }
  );
  
    const run = await openai.value.beta.threads.runs.create(
      threadId.value,
      { 
        assistant_id: assistantId.value
      }
    );
  
    // wait for the run to complete
    const timeStart = Date.now();
    const duration = ref(0);
  
    const run_status = ref(await openai.value.beta.threads.runs.retrieve(
      threadId.value,
      run.id
    ));
  
    while (run_status.value.status != "completed" && run.status != "failed") {
      await sleep(1500);
      run_status.value = await openai.value.beta.threads.runs.retrieve(
        threadId.value,
        run.id
      );
      duration.value = Date.now() - timeStart;
      console.log(run_status.value.status);
      console.log(duration.value);
    }
  
    const assistants_response = await openai.value.beta.threads.messages.list(
      threadId.value
    );
    MainMessage.value = assistants_response.data[0].content[0].text.value;
  } // end of else Demo=False
  
    apiRequestInProgress.value = false;
  }
  
  function ResetAll(){
    WelcomeMessage.value = '';
    MainInput.value = '';
    MainMessage.value = '';
    threadId.value = '';
  }
  </script>