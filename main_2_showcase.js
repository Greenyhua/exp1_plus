const jsPsych = initJsPsych({display_element: 'jspsych-experiment'});

let all_sequences = []; // 全局变量，方便多处引用

// 1. 信息收集
const subject_info = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<h3>实验登记</h3><p>请输入如下信息（所有项必填）：</p>',
  html: `
    <label>被试编号：<input name="subject_id" type="text" required></label><br><br>
    <label>姓名：<input name="name" type="text" required></label><br><br>
    <label>年龄：<input name="age" type="number" min="1" max="120" required></label><br><br>
    <label>性别：<input name="gender" type="radio" value="1" required> 男
           <input name="gender" type="radio" value="2" required> 女</label><br>
  `,
  button_label: '提交',
  data: {task: 'subject_info'}
};

// 2. 全屏与指导语
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

const enter_fullscreen = {
  type: jsPsychFullscreen,
  fullscreen_mode: true,
  message: '<p>接下来实验将自动全屏。请点击下方按钮开始。</p>',
  button_label: '开始全屏'
};

const instruction = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="text-align:center;">
      <h3>任务1指导语</h3>
      <p>每个回合，你会看到屏幕中央出现一个十字。<br>
      然后你会看到一张面孔的变化动画。<br>
      这张面孔可能是你熟悉的名人，或陌生人，也可能是你本人。<br>
      当你可以从动画中识别出该面孔的身份时，请立即按空格。<br>
      请又快又准确地判断。<br>
      随后，请你用鼠标选择该面孔的身份（名人，陌生人，或你自己）。</p>
    </div>
  `,
  choices: ['继续']
};

const fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size:64px;text-align:center;">+</div>',
  choices: "NO_KEYS",
  trial_duration: 1000
};

// 3. 序列生成函数
function generate_sequences(subject_id) {
  let all_sequences = [];
  // selfX部分
  let self_prefix = `static/stimuli/${subject_id}/self${subject_id}_`;
  for (let s of ['A', 'B', 'C', 'D', 'E', 'F']) {
    let seq = [];
    for (let i = 1; i <= 7; i++) {
      seq.push(`${self_prefix}${s}${i}.jpg`);
    }
    all_sequences.push({
      seq_type: 'self',
      seq_name: `self${subject_id}_${s}`,
      imgs: seq
    });
  }
  // common_y部分
  let xInt = parseInt(subject_id);
  let y = (xInt % 4 === 0) ? 0 : xInt % 4;
  let common_prefix = `static/stimuli/common_${y}/`;
  for (let cat of ['cele', 'other', 'own']) {
    for (let s of ['A', 'B', 'C', 'D', 'E', 'F']) {
      let seq = [];
      for (let i = 1; i <= 7; i++) {
        seq.push(`${common_prefix}${cat}_${s}${i}.jpg`);
      }
      all_sequences.push({
        seq_type: cat,
        seq_name: `${cat}_${s}`,
        imgs: seq
      });
    }
  }
  // 随机打乱
  return jsPsych.randomization.shuffle(all_sequences);
}

function get_animation_trials(all_sequences) {
  let trials = [];
  all_sequences.forEach((seq_obj, idx) => {
    trials.push(fixation);

    let animation_start_time = null;
    let animation_rt = null;
    let animation_stopped = false;
    let image_trial_index = 0;
    let pressed_frame_idx = null; // 新增，记录第几帧按下

    // 1. 初始化trial
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
      }
    });

    // 2. 图片循环trial
    trials.push({
      timeline: [
        {
          type: jsPsychImageKeyboardResponse,
          stimulus: function(){
            return seq_obj.imgs[image_trial_index];
          },
          stimulus_width: 120,
          choices: [' '],
          trial_duration: 150,
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
              pressed_frame_idx = image_trial_index + 1; // 这里记录（下标从0开始）
            }
            image_trial_index += 1;
          }
        }
      ],
      loop_function: function(){
        return (!animation_stopped) && (image_trial_index < seq_obj.imgs.length);
      }
    });

    // 2.5. 如果动画期间没按空格，加一个“最后一帧图片等待按空格”trial
    trials.push({
      type: jsPsychImageKeyboardResponse,
      stimulus: seq_obj.imgs[seq_obj.imgs.length - 1],
      stimulus_width: 120,
      choices: [' '],
      trial_duration: null, // 无限等待
      response_ends_trial: true,
      data: {
        seq_type: seq_obj.seq_type,
        seq_name: seq_obj.seq_name,
        task: 'face_animation_hold'
      },
      on_start: function(trial){
        trial.trial_duration = null;
        if(animation_stopped) trial.trial_duration = 0; // 已经按过空格，直接跳过本trial
      },
      on_finish: function(data){
        if(!animation_stopped) {
          animation_rt = performance.now() - animation_start_time;
          animation_stopped = true;
          pressed_frame_idx = seq_obj.imgs.length; // 最后一帧
        }
      }
    });

    // 3. 选择题
    trials.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: "<p>你认为刚才出现的面孔是：</p>",
      choices: ['名人', '你自己', '陌生人'],
      data: {
        seq_type: seq_obj.seq_type,
        seq_name: seq_obj.seq_name,
        task: "identity_choice"
      },
      on_start: function(trial) {
        if(animation_rt === null) animation_rt = "NA";
        // 把frame index写入data
        trial.pressed_frame_idx = pressed_frame_idx;
      },
      on_finish: function(data){
        data.animation_rt = animation_rt;
        data.choice = ['名人', '你自己', '陌生人'][data.response];
        data.pressed_frame_idx = pressed_frame_idx; // 关键：写入数据
      }
    });
  });
  return trials;
}

const show_results_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function(){
    // 获取被试信息
    const info = jsPsych.data.get().filter({task: "subject_info"}).values()[0].response;
    // 获取试次数据
    const trials = jsPsych.data.get().filter({task: "identity_choice"}).values();
    // 构建表头
    let html = `
      <h3>实验结果</h3>
      <p>被试编号：${info.subject_id} &emsp; 姓名：${info.name} &emsp; 年龄：${info.age} &emsp; 性别：${info.gender == '1' ? '男' : '女'}</p>
      <table border="1" style="margin:auto; border-collapse:collapse;">
        <tr>
          <th>序号</th>
          <th>序列名</th>
          <th>类别</th>
          <th>反应时(ms)</th>
          <th>按键时帧号</th>
          <th>被试选择</th>
        </tr>
    `;
    trials.forEach((t, idx) => {
      html += `<tr>
        <td>${idx+1}</td>
        <td>${t.seq_name}</td>
        <td>${t.seq_type}</td>
        <td>${t.animation_rt === "NA" ? "NA" : Math.round(t.animation_rt)}</td>
        <td>${t.pressed_frame_idx ?? ""}</td>
        <td>${t.choice || ['名人', '你自己', '陌生人'][t.response]}</td>
      </tr>`;
    });
    html += "</table>";
    html += "<p>点击下方按钮，退出实验。</p>";
    return html;
  },
  choices: ['确认，退出实验'],
  on_finish: function(){
    jsPsych.endExperiment("实验已结束，感谢您的参与！请关闭页面。");
  }
};


// 5. 主流程
let timeline = [
  subject_info,
  {
    timeline: [
      // 预加载图片
      {
        type: jsPsychPreload,
        images: function() {
          const infoTrial = jsPsych.data.get().filter({task: "subject_info"}).values()[0];
          const subject_id = infoTrial && infoTrial.response ? infoTrial.response.subject_id : "X";
          all_sequences = generate_sequences(subject_id); // 保存到全局变量
          // 平铺所有图片
          const all_imgs = all_sequences.flatMap(seq => seq.imgs);
          // DEBUG: 打印所有图片路径
          console.log("预加载所有图片路径：", all_imgs);
          return all_imgs;
        }
      },
      experiment_instruction,
      enter_fullscreen,
      instruction,
      {
        timeline: [],
        on_timeline_start: function() {
          // all_sequences 已在 preload 中生成
          // 只要前5个序列
          const n_demo = 5;
          const demo_sequences = all_sequences.slice(0, n_demo); // 前5个序列
          this.timeline.push(...get_animation_trials(demo_sequences));
        }
      },
      show_results_trial
    ]
  }

];



// 6. 运行
jsPsych.run(timeline);