<?php
return [
 'sop_whatsapp'=>[
  'token'=>env('WHATSAPP_ACCESS_TOKEN'),
  'phone_id'=>env('WHATSAPP_PHONE_NUMBER_ID'),
  'version'=>env('WHATSAPP_GRAPH_API_VERSION','v23.0')
 ],
 'sop_ai'=>[
  'key'=>env('SOP_AI_API_KEY'),
  'model'=>env('SOP_AI_MODEL','gpt-4.1-mini')
 ]
];
