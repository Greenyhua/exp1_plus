

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
  data: {
    task: 'subject_info'
  }
};

// 须知
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

// 全屏
const enter_fullscreen = {
  type: jsPsychFullscreen,
  fullscreen_mode: true,
  message: '<p>接下来实验将自动全屏。请点击下方按钮开始。</p>',
  button_label: '开始全屏'
};

const face_image_paths = [
    'static/stimuli/self1_A1.jpg',
    'static/stimuli/self1_A2.jpg',
    'static/stimuli/self1_A3.jpg',
    'static/stimuli/self1_A4.jpg',
    'static/stimuli/self1_A5.jpg',
    'static/stimuli/self1_A6.jpg',
    'static/stimuli/self1_A7.jpg'
  ];
  
  const jsPsych = initJsPsych({
    display_element: 'jspsych-experiment',
  });
  
  // 指导语
  const instruction = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="text-align:center;">
        <h3>任务1指导语</h3>
        <p>每个回合，你会看到屏幕中央出现一个十字。<br>
        然后你会看到一张面孔的变化动画。<br>
        这张面孔可能是你熟悉的名人，也可能是你本人。<br>
        当你可以从动画中识别出该面孔的身份时，请立即按空格。<br>
        请又快又准确地判断。<br>
        随后，请你用鼠标选择该面孔的身份（名人或你自己）。</p>
      </div>
    `,
    choices: ['继续']
  };
  
  // 注视点
  const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div style="font-size:64px;text-align:center;">+</div>',
    choices: "NO_KEYS",
    trial_duration: 1000
  };
  
  // ----------- 动画部分：多张图片，空格提前终止 -------------
  let animation_start_time = null;
  let animation_rt = null;
  let animation_stopped = false;
  
  const animation_start = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '',
    choices: "NO_KEYS",
    trial_duration: 0,
    on_start: function() {
      animation_start_time = performance.now();
      animation_rt = null;
      animation_stopped = false;
      window.__image_trial_index = 0; // 当前呈现到第几张
    }
  };
  
  const single_image_trial = {
    type: jsPsychImageKeyboardResponse,
    stimulus: function(){
      // 动态决定当前是哪一张
      return face_image_paths[window.__image_trial_index];
    },
    choices: [' '],
    trial_duration: 150,
    stimulus_width: 300,
    response_ends_trial: true,
    on_finish: function(data) {
      if(data.response !== null && animation_rt === null) {
        animation_rt = performance.now() - animation_start_time;
        animation_stopped = true;
      }
      window.__image_trial_index += 1;
    }
  };
  
  const image_sequence_loop = {
    timeline: [single_image_trial],
    loop_function: function(){
      // 如果没按空格 且 还没到最后一张 就继续loop
      return (!animation_stopped) && (window.__image_trial_index < face_image_paths.length);
    }
  };
  
  const identity_choice = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "<p>你认为刚才出现的面孔是：</p>",
    choices: ['名人', '你自己'],
    data: {
      task: "identity_choice"
    },
    on_start: function(trial) {
      trial.data.rt = animation_rt;
    }
  };
  


  // 任务2指导语
const task2_instruction = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="text-align:center;">
        <h3>任务2指导语</h3>
        <p>身份识别实验<br>
        每个回合，你会看到一个人向你接近。<br>
        你可以滑动图片下方的滑块，来调整这个人与你之间的距离。<br>
        请将图片停在你认为最舒适的距离。</p>
      </div>
    `,
    choices: ['继续']
  };
  
  // 任务2流程
  const prac_img = 'static/stimuli/prac_6.jpg';
  
  const canvas_w = 600, canvas_h = 480; // 你随便改
  const n_levels = 8;
  const labels = ["35m", "30m", "25m", "20m", "15m", "10m", "5m", "1m"];
  
  // 比例参数（你可以微调以获得你喜欢的视觉效果）
  const top_y_frac = 0.12, bottom_y_frac = 0.93;
  const top_w_frac = 0.18, bottom_w_frac = 0.8;
  
  const top_y = canvas_h * top_y_frac;
  const bottom_y = canvas_h * bottom_y_frac;
  const top_w = canvas_w * top_w_frac;
  const bottom_w = canvas_w * bottom_w_frac;
  
  const center_x = canvas_w / 2;
  const left_top = {x: center_x - top_w/2, y: top_y};
  const right_top = {x: center_x + top_w/2, y: top_y};
  const left_bottom = {x: center_x - bottom_w/2, y: bottom_y};
  const right_bottom = {x: center_x + bottom_w/2, y: bottom_y};
  

  
const task2_trial = {
  type: jsPsychHtmlSliderResponse,
  stimulus: function(){
    return `
      <div id="perspective-box" style="position:relative;width:${canvas_w}px;height:${canvas_h}px;margin:0 auto;background:#000;">
        <canvas id="perspective-canvas" width="${canvas_w}" height="${canvas_h}" style="display:block;"></canvas>
        <img id="person-img" src="${prac_img}" style="position:absolute;left:50%;transform:translateX(-50%);z-index:2;">
      </div>
      <p style="color:black;font-size:22px;text-align:center;margin-top:30px;">滑动滑块来选择最舒适的距离</p>
    `;
  },
  min: 0,
  max: n_levels-1,
  step: 1,
  slider_start: 0,
  labels: labels,
  prompt: "",
  require_movement: false,
  on_load: function(){
    // 画梯形
    const canvas = document.getElementById('perspective-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas_w,canvas_h);

    // 梯形轮廓
    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left_bottom.x, left_bottom.y);
    ctx.lineTo(left_top.x, left_top.y);
    ctx.lineTo(right_top.x, right_top.y);
    ctx.lineTo(right_bottom.x, right_bottom.y);
    ctx.closePath();
    ctx.stroke();

    // 横线
    ctx.font = "24px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    for(let i=0; i<n_levels; i++){
      // 计算等距y
      const frac = i/(n_levels-1); // 0~1
      const y = top_y + (bottom_y-top_y)*frac;
      // 计算当前y处的横线宽度
      const w = top_w + (bottom_w-top_w)*frac;
      // 横线两端
      const lx = center_x - w/2;
      const rx = center_x + w/2;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(rx, y);
      ctx.stroke();
      // 标签
      ctx.fillText(labels[i], rx + 16, y + 8);
    }
    ctx.restore();

    // 人像位置与大小
    const img = document.getElementById('person-img');
    function setImgByLevel(idx){
      const frac = idx/(n_levels-1);
      const y = top_y + (bottom_y-top_y)*frac;
      const minPic = canvas_w * 0.10; // 最远时人像宽度为画布10%
      const maxPic = canvas_w * 0.33; // 最近时人像宽度为画布33%
      const w = minPic + (maxPic - minPic) * frac;
      const h = w; // 正方形
      img.style.width = w + "px";
      img.style.height = h + "px";
      img.style.left = "50%";
      img.style.top = (y - h) + 'px'; // 图片底部与横线齐平
    }
    setImgByLevel(0);

    // 滑块事件监听
    const slider = document.querySelector('input[type=range]');
    if(slider && img){
      slider.addEventListener('input', function(){
        setImgByLevel(parseInt(slider.value));
      });
    }
  },
  data: {
    task: "distance_adjust"
  }
};
  
function exportKeyResults() {
    // 获取被试信息
    const infoTrial = jsPsych.data.get().filter({task: "subject_info"}).values()[0];
    let subject_id = "", name = "", age = "", gender = "";
    if (infoTrial && infoTrial.response) {
      const resp = infoTrial.response;
      subject_id = resp.subject_id || "";
      name = resp.name || "";
      age = resp.age || "";
      gender = resp.gender || "";
    }


  // 1. 获取任务1反应时
  const identityTrial = jsPsych.data.get().filter({task: "identity_choice"}).values()[0];
  const task1_rt = identityTrial ? identityTrial.rt : "";

  // 2. 获取任务1选择
  const task1_choice = identityTrial ? identityTrial.response : "";
  const task1_choice_label = task1_choice === 0 ? "名人" : "你自己";

  // 3. 获取任务2滑块选择
  const sliderTrial = jsPsych.data.get().filter({task: "distance_adjust"}).values()[0];
  const task2_slider_idx = sliderTrial ? sliderTrial.response : "";
  const task2_slider_label = (typeof task2_slider_idx === "number" && labels[task2_slider_idx])
      ? labels[task2_slider_idx] : "";

  // 4. 组装CSV内容
  let csv = "subject_id,name,age,gender,task1_rt,task1_choice,task1_choice_label,task2_distance_idx,task2_distance_label\n";
  csv += [subject_id, name, age, gender, task1_rt, task1_choice, task1_choice_label, task2_slider_idx, task2_slider_label].join(",") + "\n";

  // 5. 生成文件下载
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "core_results.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

    const end_screen = {
      type: jsPsychHtmlButtonResponse,
      stimulus: `<h2>实验结束！</h2>
                 <p>感谢参与。点击下方按钮导出你的实验数据。</p>
                 <button id="my-export-btn" class="jspsych-btn" style="margin-top:20px;">导出数据</button>`,
      choices: [],
      on_load: function() {
        document.getElementById("my-export-btn").onclick = exportKeyResults;
      }
    };


  
  const timeline = [
    subject_info,
    experiment_instruction,
    enter_fullscreen,
    instruction,
    fixation,
    animation_start,
    image_sequence_loop,
    identity_choice,
    task2_instruction,
    task2_trial,
    end_screen
  ];
  
  jsPsych.run(timeline);