const jsPsych = initJsPsych({display_element: 'jspsych-experiment'});

// 1. 实验须知
const experiment_instruction = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="text-align:center;">
      <h3>实验须知</h3>
      <p>本实验大约持续20分钟，请保证周围环境安静、不受干扰。<br>
      实验开始后会自动进入全屏。如需中途退出，请按ESC键（中途退出不会保存数据）。</p>
    </div>
  `,
  choices: ['确认，进入实验']
};

// 2. 全屏
const enter_fullscreen = {
  type: jsPsychFullscreen,
  fullscreen_mode: true,
  message: '<p>接下来实验将自动全屏。请点击下方按钮开始。</p>',
  button_label: '开始全屏'
};

// 3. 指导语
const instruction = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="text-align:center; font-size:24px; line-height:1.8;">
      <h2>任务指导语</h2>
      <p>每个回合，你会看到屏幕中央出现一个十字。<br>
      然后你会看到一张面孔的变化动画。<br>
      这张面孔可能是你自己，也可能是你认识的某位名人，也可能是一个陌生的中国人，或一个陌生的外国人。<br>
      当你可以辨认出这张面孔的身份时，请立即<strong>按键</strong>。<br>
      如果这张面孔：<br>
      是<strong><span style="color:#C82423;">你自己</span></strong>，请按<strong><span style="color:#C82423;">Q</span></strong><br>
      是<strong><span style="color:#C82423;">你认识的名人</span></strong>，请按<strong><span style="color:#C82423;">R</span></strong><br>
      是<strong><span style="color:#C82423;">陌生的中国人</span></strong>，请按<strong><span style="color:#C82423;">U</span></strong><br>
      是<strong><span style="color:#C82423;">陌生的外国人</span></strong>，请按<strong><span style="color:#C82423;">P</span></strong><br>
      请又快又准确地作出反应。</p>
      <p style="color:#888;margin-top:24px;">请按空格键继续</p>
    </div>
  `,
  choices: [' ']
};

// 4. 固定的fixation
const fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size:64px;text-align:center;">+</div>',
  choices: "NO_KEYS",
  trial_duration: 1000
};

// 5. 生成序列（A、B、C，每个14张）
function generate_practice_sequences_14ver() {
  let sequences = [];
  const img_dir = 'static/stimuli/14ver/';
  for (let s of ['A', 'B', 'C']) {
    let seq = [];
    for (let i = 1; i <= 14; i++) {
      seq.push(`${img_dir}14ver_${s}${i}.jpg`);
    }
    sequences.push({
      seq_type: 'self',
      seq_name: `14ver_${s}`,
      imgs: seq
    });
  }
  return sequences;
}

// 6. 动画试次生成（与你原来一致）
function get_animation_trials(all_sequences) {
  let trials = [];
  all_sequences.forEach((seq_obj, idx) => {
    trials.push(fixation);

    let animation_start_time = null;
    let animation_rt = null;
    let animation_stopped = false;
    let image_trial_index = 0;
    let pressed_frame_idx = null;
    let pressed_key = null;

    // 初始化
    trials.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '',
      choices: "NO_KEYS",
      trial_duration: 0,
      on_start: function(){
        animation_start_time = performance.now();
        animation_rt = null;
        animation_stopped = false;
        image_trial_index = 0;
        pressed_frame_idx = null;
        pressed_key = null;
      }
    });

    // 图片循环
    trials.push({
      timeline: [
        {
          type: jsPsychImageKeyboardResponse,
          stimulus: function(){
            return seq_obj.imgs[image_trial_index];
          },
          stimulus_width: 120,
          choices: ['q', 'r', 'u', 'p'],
          trial_duration: 750,
          response_ends_trial: true,
          data: {
            seq_type: seq_obj.seq_type,
            seq_name: seq_obj.seq_name,
            task: 'face_animation'
          },
          on_finish: function(data) {
            if(data.response !== null && animation_rt === null) {
              animation_rt = performance.now() - animation_start_time;
              animation_stopped = true;
              pressed_frame_idx = image_trial_index + 1;
              pressed_key = data.response;
            }
            image_trial_index += 1;
          }
        }
      ],
      loop_function: function(){
        return (!animation_stopped) && (image_trial_index < seq_obj.imgs.length);
      }
    });

    // 如果动画期间没按键，加一个“最后一帧图片等待按键”trial
    trials.push({
      type: jsPsychImageKeyboardResponse,
      stimulus: seq_obj.imgs[seq_obj.imgs.length - 1],
      stimulus_width: 120,
      choices: ['q', 'r', 'u', 'p'],
      trial_duration: null,
      response_ends_trial: true,
      data: {
        seq_type: seq_obj.seq_type,
        seq_name: seq_obj.seq_name,
        task: 'face_animation_hold'
      },
      on_start: function(trial){
        trial.trial_duration = null;
        if(animation_stopped) trial.trial_duration = 0;
      },
      on_finish: function(data){
        if(!animation_stopped) {
          animation_rt = performance.now() - animation_start_time;
          animation_stopped = true;
          pressed_frame_idx = seq_obj.imgs.length;
          pressed_key = data.response;
        }
      }
    });

    // 结果写入
    trials.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '',
      trial_duration: 0,
      choices: "NO_KEYS",
      data: {
        seq_type: seq_obj.seq_type,
        seq_name: seq_obj.seq_name,
        task: "animation_result"
      },
      on_start: function(trial) {},
      on_finish: function(data){
        data.animation_rt = animation_rt;
        data.pressed_frame_idx = pressed_frame_idx;
        data.pressed_key = pressed_key;
      }
    });
  });
  return trials;
}

// 7. 导出数据
function exportKeyResults() {
  const trials = jsPsych.data.get().filter({task: "animation_result"}).values();
  let csv = "seq_name,seq_type,animation_rt,pressed_frame_idx,pressed_key\n";
  trials.forEach(t => {
    const row = [
      t.seq_name || "",
      t.seq_type || "",
      (t.animation_rt === "NA" ? "NA" : Math.round(t.animation_rt) || ""),
      t.pressed_frame_idx ?? "",
      t.pressed_key ?? ""
    ];
    csv += row.join(",") + "\n";
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `key_results.csv`;
  a.click();
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
}

// 8. 汇总结果表
const show_results_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function(){
    const trials = jsPsych.data.get().filter({task: "animation_result"}).values();
    let html = `
      <h3>实验结果</h3>
      <table border="1" style="margin:auto; border-collapse:collapse;">
        <tr>
          <th>序号</th>
          <th>序列名</th>
          <th>类别</th>
          <th>反应时(ms)</th>
          <th>按键时帧号</th>
          <th>按键</th>
        </tr>
    `;
    trials.forEach((t, idx) => {
      html += `<tr>
        <td>${idx+1}</td>
        <td>${t.seq_name}</td>
        <td>${t.seq_type}</td>
        <td>${t.animation_rt === "NA" ? "NA" : Math.round(t.animation_rt)}</td>
        <td>${t.pressed_frame_idx ?? ""}</td>
        <td>${t.pressed_key ?? ""}</td>
      </tr>`;
    });
    html += "</table>";
    html += "<p>请先对此界面拍照，然后联系主试。</p>";
    html += `<button id="my-export-btn" class="jspsych-btn" style="margin-top:20px;">导出本次数据（CSV）</button>`;
    html += "<p style='font-size:13px;color:#888;'>导出后请把CSV文件发给主试。</p>";
    return html;
  },
  choices: ['主试已通知我点击此按钮'],
  on_load: function() {
    document.getElementById("my-export-btn").onclick = exportKeyResults;
  }
};

const exit_fullscreen_and_thank_you = {
  type: jsPsychFullscreen,
  fullscreen_mode: false,
  message: ''
};
const end_message_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="text-align:center;">
      <h2>实验结束</h2>
      <p>请把网页生成的文件发给主试。</p>
      <p>感谢您的参与！可以关闭本页面。</p>
    </div>
  `,
  choices: ['关闭页面']
};

// 9. 组装timeline
const all_sequences = generate_practice_sequences_14ver();
const preload_imgs = all_sequences.flatMap(seq => seq.imgs);

let timeline = [
  {
    type: jsPsychPreload,
    images: preload_imgs
  },
  experiment_instruction,
  enter_fullscreen,
  instruction,
  ...get_animation_trials(all_sequences),
  show_results_trial,
  exit_fullscreen_and_thank_you,
  end_message_trial
];

// 10. 运行
jsPsych.run(timeline);