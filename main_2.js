const jsPsych = initJsPsych({display_element: 'jspsych-experiment'});

let all_sequences = []; // 全局

const password_error_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="color:#C82423;font-size:24px;text-align:center;">密码错误！<br><br>请点击下方按钮重新输入。</div>`,
    choices: ["重新输入"]
  };
  
  const subject_info = {
    type: jsPsychSurveyHtmlForm,
    preamble: '<h3>实验登记</h3><p>请输入如下信息（所有项必填）：</p>',
    html: `
      <label>被试编号：<input name="subject_id" type="text" required></label><br><br>
      <label>姓名：<input name="name" type="text" required></label><br><br>
      <label>年龄：<input name="age" type="number" min="1" max="120" required></label><br><br>
      <label>性别：<input name="gender" type="radio" value="1" required> 男
             <input name="gender" type="radio" value="2" required> 女</label><br><br>
      <label>密码：<input name="password" type="text" required autocomplete="off"></label>
    `,
    button_label: '提交',
    data: {task: 'subject_info'}
  };
  
  const password_check = {
    timeline: [],
    on_timeline_start: function() {
      const infos = jsPsych.data.get().filter({task: "subject_info"}).values();
      const latest = infos[infos.length - 1];
      const info = typeof latest.response === "string" ? JSON.parse(latest.response) : latest.response;
      const subject_id = (info.subject_id || "").toString().trim();
      const password = (info.password || "").toString().trim();
      const correct = `3jyz76${subject_id}pk`;
  
      if(password !== correct) {
        this.timeline.push(password_error_trial);
      }
      // 密码正确无需push任何trial
    }
  };
  
  let last_password_wrong = false;

const subject_info_password_check = {
  timeline: [
    {
      timeline: [password_error_trial],
      conditional_function: function(){
        return last_password_wrong;
      }
    },
    subject_info,
    {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '',
      trial_duration: 0,
      choices: "NO_KEYS",
      on_start: function(){},
      on_finish: function(){
        const infos = jsPsych.data.get().filter({task: "subject_info"}).values();
        const latest = infos[infos.length - 1];
        const info = typeof latest.response === "string" ? JSON.parse(latest.response) : latest.response;
        const subject_id = (info.subject_id || "").toString().trim();
        const password = (info.password || "").toString().trim();
        const correct = `3jyz76${subject_id}pk`;
        last_password_wrong = (password !== correct);
      }
    }
  ],
  loop_function: function(data) {
    return last_password_wrong;
  }
};


// 2. 全屏与指导语
const experiment_instruction = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="text-align:center;">
      <h3>实验须知</h3>
      <p>本实验大约持续10分钟，请保证周围环境安静、不受干扰。<br>
      实验开始后会自动进入全屏。<br>
      按ESC键可退出全屏（中途退出不会保存数据）。<br>
      如非意外，<strong><span style="color:#C82423;">请勿中途退出全屏</span></strong></p>
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
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="text-align:center; font-size:24px; line-height:1.8;">
        <h2>任务指导语</h2>
        <p>每个回合，你会看到屏幕中央出现一个十字。<br>
        然后你会看到一张面孔的变化动画。<br>
        这张面孔可能是你自己，也可能是你认识的某位名人，也可能是一个陌生的中国人，或一个陌生的外国人。<br>
        当你可以辨认出这张面孔的身份时，请立即<strong>按键</strong>。<br>
        请将右手的<strong><span style="color:#C82423;">食指、中指、无名指、小指</span></strong>分别放在<strong><span style="color:#C82423;">H、J、K、L</span></strong>键上。<br>
        如果这张面孔：<br>
        是<strong><span style="color:#C82423;">你自己</span></strong>，请按<strong><span style="color:#C82423;">H</span></strong><br>
        是<strong><span style="color:#C82423;">你认识的名人</span></strong>，请按<strong><span style="color:#C82423;">J</span></strong><br>
        是<strong><span style="color:#C82423;">陌生的中国人</span></strong>，请按<strong><span style="color:#C82423;">K</span></strong><br>
        是<strong><span style="color:#C82423;">陌生的外国人</span></strong>，请按<strong><span style="color:#C82423;">L</span></strong><br>
        请又快又准确地作出反应。</p>
        <p style="color:#888;margin-top:24px;">请按空格键继续</p>
      </div>
    `,
    choices: [' ']
  };

const fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size:64px;text-align:center;">+</div>',
  choices: "NO_KEYS",
  trial_duration: 1000
};

function generate_practice_sequences(subject_id) {
    let practice_sequences = [];
  
    // self 部分（两个序列A、B）
    let self_prefix = `static/stimuli/practice/${subject_id}/self${subject_id}_`;
    for (let s of ['A', 'B']) {
      let seq = [];
      for (let i = 1; i <= 13; i++) {
        seq.push(`${self_prefix}${s}${i}.jpg`);
      }
      practice_sequences.push({
        seq_type: 'self',
        seq_name: `practice_self${s}`,
        imgs: seq
      });
    }
  
    // common 部分（own_A/B, other_A/B, cele_A/B），所有被试共用
    let common_prefix = `static/stimuli/practice/common/`;
    for (let cat of ['own', 'other', 'cele']) {
      for (let s of ['A', 'B']) {
        let seq = [];
        for (let i = 1; i <= 13; i++) {
          seq.push(`${common_prefix}${cat}_${s}${i}.jpg`);
        }
        practice_sequences.push({
          seq_type: cat,
          seq_name: `practice_${cat}_${s}`,
          imgs: seq
        });
      }
    }
  
    // 随机打乱
    return jsPsych.randomization.shuffle(practice_sequences);
  }

// 1. 判定函数
function is_practice_response_correct(seq_type, key) {
    if(seq_type === 'self') return key === 'h';
    if(seq_type === 'cele') return key === 'j';
    if(seq_type === 'own')  return key === 'k';
    if(seq_type === 'other')return key === 'l';
    return false;
  }
  
  // 2. 练习动画+反馈
  function get_practice_animation_trials(practice_sequences) {
    let trials = [];
    practice_sequences.forEach((seq_obj, idx) => {
      trials.push(fixation);
  
      let animation_start_time = null;
      let animation_rt = null;
      let animation_stopped = false;
      let image_trial_index = 0;
      let pressed_frame_idx = null;
      let pressed_key = null;
  
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
  
      trials.push({
        timeline: [
          {
            type: jsPsychImageKeyboardResponse,
            stimulus: function(){
              return seq_obj.imgs[image_trial_index];
            },
            stimulus_width: 200,
            choices: ['h', 'j', 'k', 'l'],
            trial_duration: 1000,
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
  
      trials.push({
        type: jsPsychImageKeyboardResponse,
        stimulus: seq_obj.imgs[seq_obj.imgs.length - 1],
        stimulus_width: 200,
        choices: ['h', 'j', 'k', 'l'],
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
  
      // 反馈
      trials.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
          const correct = is_practice_response_correct(seq_obj.seq_type, pressed_key);
          return `<div style="font-size:28px;color:${correct ? '#30C23F' : '#C82423'};text-align:center;">
            ${correct ? '选择正确 ✓' : '选择错误 ✗'}
          </div>`;
        },
        choices: "NO_KEYS",
        trial_duration: 500,
        data: {
          seq_type: seq_obj.seq_type,
          seq_name: seq_obj.seq_name,
          task: "practice_feedback"
        }
      });
    });
    return trials;
  }

  const practice_instruction = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="text-align:center; font-size:24px; line-height:1.8;">
        <h2>练习阶段</h2>
        <p>接下来是练习环节。练习流程与正式实验完全一致。</p>
        在练习环节，你会知道自己的选择是否正确。<br>
        提示：<br>
        请将右手的<strong><span style="color:#C82423;">食指、中指、无名指、小指</span></strong>分别放在<strong><span style="color:#C82423;">H、J、K、L</span></strong>键上。<br>
        如果这张面孔：<br>
        是<strong><span style="color:#C82423;">你自己</span></strong>，请按<strong><span style="color:#C82423;">H</span></strong><br>
        是<strong><span style="color:#C82423;">你认识的名人</span></strong>，请按<strong><span style="color:#C82423;">J</span></strong><br>
        是<strong><span style="color:#C82423;">陌生的中国人</span></strong>，请按<strong><span style="color:#C82423;">K</span></strong><br>
        是<strong><span style="color:#C82423;">陌生的外国人</span></strong>，请按<strong><span style="color:#C82423;">L</span></strong><br>
        请又快又准确地作出反应。</p>
        <p style="color:#888;margin-top:24px;">请按空格键开始练习</p>
      </div>
    `,
    choices: [' ']
  };

  const practice_end_instruction = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="text-align:center; font-size:24px; line-height:1.8;">
        <h2>练习完成</h2>
        <p>您已完成练习。<br>请按空格键，进入正式实验。</p>
        正式实验大约需要8分钟完成。<br>
        在正式实验，你<strong>不会</strong>知道自己的选择是否正确。<br>
        提示：<br>
        请将右手的<strong><span style="color:#C82423;">食指、中指、无名指、小指</span></strong>分别放在<strong><span style="color:#C82423;">H、J、K、L</span></strong>键上。<br>
        如果这张面孔：<br>
        是<strong><span style="color:#C82423;">你自己</span></strong>，请按<strong><span style="color:#C82423;">H</span></strong><br>
        是<strong><span style="color:#C82423;">你认识的名人</span></strong>，请按<strong><span style="color:#C82423;">J</span></strong><br>
        是<strong><span style="color:#C82423;">陌生的中国人</span></strong>，请按<strong><span style="color:#C82423;">K</span></strong><br>
        是<strong><span style="color:#C82423;">陌生的外国人</span></strong>，请按<strong><span style="color:#C82423;">L</span></strong><br>
        请又快又准确地作出反应。</p>
        <p style="color:#888;margin-top:24px;">请按空格键进入正式实验</p>
      </div>
    `,
    choices: [' ']
  };

// 3. 序列生成函数
function generate_sequences(subject_id) {
  let all_sequences = [];
  // selfX部分
  let self_prefix = `static/stimuli/${subject_id}/self${subject_id}_`;
  for (let s of ['A', 'B', 'C', 'D', 'E', 'F']) {
    let seq = [];
    for (let i = 1; i <= 13; i++) {
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
      for (let i = 1; i <= 13; i++) {
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

// 4. 动画试次生成
function get_animation_trials(all_sequences) {
  let trials = [];
  all_sequences.forEach((seq_obj, idx) => {
    trials.push(fixation);

    let animation_start_time = null;
    let animation_rt = null;
    let animation_stopped = false;
    let image_trial_index = 0;
    let pressed_frame_idx = null; // 记录第几帧按下
    let pressed_key = null; // 记录按下的键

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
        pressed_key = null;
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
          stimulus_width: 200,
          choices: ['h', 'j', 'k', 'l'],
          trial_duration: 1000,
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
              pressed_frame_idx = image_trial_index + 1; // 下标从0开始
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

    // 2.5. 如果动画期间没按键，等待按键
    trials.push({
      type: jsPsychImageKeyboardResponse,
      stimulus: seq_obj.imgs[seq_obj.imgs.length - 1],
      stimulus_width: 200,
      choices: ['h', 'j', 'k', 'l'],
      trial_duration: null, // 无限等待
      response_ends_trial: true,
      data: {
        seq_type: seq_obj.seq_type,
        seq_name: seq_obj.seq_name,
        task: 'face_animation_hold'
      },
      on_start: function(trial){
        trial.trial_duration = null;
        if(animation_stopped) trial.trial_duration = 0; // 已经按过，直接跳过
      },
      on_finish: function(data){
        if(!animation_stopped) {
          animation_rt = performance.now() - animation_start_time;
          animation_stopped = true;
          pressed_frame_idx = seq_obj.imgs.length; // 最后一帧
          pressed_key = data.response;
        }
      }
    });

    // 3. 结果写入
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
      on_start: function(trial) {
        
      },
      on_finish: function(data){
        data.animation_rt = animation_rt;
        data.pressed_frame_idx = pressed_frame_idx;
        data.pressed_key = pressed_key;
      }
    });
  });
  return trials;
}

// ====== exportKeyResults ======
function exportKeyResults() {
  // 1. 获取被试信息
  const info = jsPsych.data.get().filter({task: "subject_info"}).values()[0].response;
  const subject_id = info.subject_id || "";
  const name = info.name || "";
  const age = info.age || "";
  const gender = info.gender == '1' ? '男' : (info.gender == '2' ? '女' : '');

  // 2. 获取实验trial数据
  const trials = jsPsych.data.get().filter({task: "animation_result"}).values();

  // 3. 组装CSV
  let csv = "subject_id,name,age,gender,seq_name,seq_type,animation_rt,pressed_frame_idx,pressed_key\n";
  trials.forEach(t => {
    const row = [
      subject_id,
      name,
      age,
      gender,
      t.seq_name || "",
      t.seq_type || "",
      (t.animation_rt === "NA" ? "NA" : Math.round(t.animation_rt) || ""),
      t.pressed_frame_idx ?? "",
      t.pressed_key ?? ""
    ];
    csv += row.join(",") + "\n";
  });

  // 4. 生成下载
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `key_results_${subject_id}.csv`;
  a.click();
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
}

// 5. 结果表
const show_results_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function(){
    const info = jsPsych.data.get().filter({task: "subject_info"}).values()[0].response;
    const trials = jsPsych.data.get().filter({task: "animation_result"}).values();
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
    // 导出按钮
    html += `<button id="my-export-btn" class="jspsych-btn" style="margin-top:20px;">导出本次数据（CSV）</button>`;
    html += "<p style='font-size:15px;color:#f8f8f8;'>请按esc退出全屏，查看数据文件是否已保存</p>";
    return html;
  },
  choices: ['文件已发送给主试，点击完成'],
  on_load: function() {
    document.getElementById("my-export-btn").onclick = exportKeyResults;
  }
};



const exit_fullscreen_and_thank_you = {
  type: jsPsychFullscreen,
  fullscreen_mode: false,
  message: '', 
  on_finish: function() {
    // 继续展示结束语
  }
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
  choices: ['关闭页面'],
  on_finish: function() {
    
  }
};

let timeline = [
    subject_info_password_check,
    {
      timeline: [
        // 预加载正式实验图片
        {
          type: jsPsychPreload,
          images: function() {
            const infoTrial = jsPsych.data.get().filter({task: "subject_info"}).values()[0];
            const subject_id = infoTrial && infoTrial.response ? infoTrial.response.subject_id : "X";
            all_sequences = generate_sequences(subject_id); // 保存到全局变量
            // 平铺所有图片
            const all_imgs = all_sequences.flatMap(seq => seq.imgs);
  
            // 预加载练习图片
            const practice_sequences = generate_practice_sequences(subject_id);
            const practice_imgs = practice_sequences.flatMap(seq => seq.imgs);
  
            // 合并返回
            return [...all_imgs, ...practice_imgs];
          },
          message: "<div style='text-align:center;font-size:20px;color:#f8f8f8'>实验加载中，请耐心等候</div>"
        },
        experiment_instruction,
        enter_fullscreen,
        instruction,
  
        // ========== 练习阶段 ==========
        practice_instruction,
        {
            timeline: [],
            on_timeline_start: function() {
              const infoTrial = jsPsych.data.get().filter({task: "subject_info"}).values()[0];
              const subject_id = infoTrial && infoTrial.response ? infoTrial.response.subject_id : "X";
              const practice_sequences = generate_practice_sequences(subject_id);
              this.timeline.push(...get_practice_animation_trials(practice_sequences)); 
            }
          },
        practice_end_instruction,
        // ========== 正式实验阶段 ==========
        {
          timeline: [],
          on_timeline_start: function() {
            // all_sequences 在 preload 中生成
            this.timeline.push(...get_animation_trials(all_sequences));
          }
        },
        show_results_trial,
        exit_fullscreen_and_thank_you, // 退出全屏
        end_message_trial // 显示实验结束语
      ]
    }
  ];

// 7. 运行
jsPsych.run(timeline);

(function() {
  let hideCursorTimer = null;
  // 恢复显示光标
  function showCursor() {
    document.body.style.cursor = "";
  }
  // 隐藏光标
  function hideCursor() {
    document.body.style.cursor = "none";
  }
  // 鼠标移动事件
  function onMouseMove() {
    showCursor();
    if (hideCursorTimer) clearTimeout(hideCursorTimer);
    hideCursorTimer = setTimeout(hideCursor, 2000);
  }
  // 监听
  window.addEventListener("mousemove", onMouseMove);
  
  hideCursorTimer = setTimeout(hideCursor, 2000);
})();