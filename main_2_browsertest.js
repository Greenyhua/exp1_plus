const jsPsych = initJsPsych({
    display_element: 'jspsych-experiment'
  });
  
  // 1. 实验说明
  const experiment_instruction = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="text-align:center;">
        <h3>实验须知</h3>
        <p>你好！现在是测试环境<br>
        测试开始后会自动进入全屏。如需中途退出，请按ESC键（中途退出不会保存数据）。</p>
      </div>
    `,
    choices: ['确认，进入测试']
  };
  
  // 2. 进入全屏
  const enter_fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: '<p>接下来将自动全屏。请点击下方按钮开始。</p>',
    button_label: '开始全屏'
  };
  
  // 3. 指导语
  const instruction = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="text-align:center; font-size:24px; line-height:1.8;">
        <h2>测试指导语</h2>
        请将右手的<strong><span style="color:#C82423;">食指、中指、无名指、小指</span></strong>分别放在<strong><span style="color:#C82423;">H、J、K、L</span></strong>键上。<br>
        并且根据屏幕提示按键
        <p style="color:#888;margin-top:24px;">请按空格键继续</p>
      </div>
    `,
    choices: [' ']
  };
  
  // 4. 四个按键响应试次
  const key_trials = [
    { key: 'h', label: '请按下 H 键' },
    { key: 'j', label: '请按下 J 键' },
    { key: 'k', label: '请按下 K 键' },
    { key: 'l', label: '请按下 L 键' }
  ].map((item, idx) => ({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="text-align:center; font-size:28px; margin-top:80px;">
        <span style="color:#C82423;font-size:36px;">${item.label}</span>
      </div>
    `,
    choices: [item.key],
    data: {
      trial_number: idx + 1,
      expected_key: item.key,
      task: 'key_test'
    },
    on_finish: function(data) {
      // jsPsych v8: data.response 是按键的字符串
      data.pressed_key = data.response;
      data.correct = (data.pressed_key === item.key);
      // data.rt 已自动记录
    }
  }));
  
  // 5. 结果展示与导出按钮
  function exportKeyTestData() {
    const trials = jsPsych.data.get().filter({task: 'key_test'}).values();
    let csv = "trial_number,expected_key,pressed_key,rt,correct\n";
    trials.forEach(t => {
      csv += [
        t.trial_number,
        t.expected_key,
        t.pressed_key,
        t.rt,
        t.correct ? '1' : '0'
      ].join(",") + "\n";
    });
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'browser_test_results.csv';
    a.click();
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  }
  
  const show_test_results = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
      const trials = jsPsych.data.get().filter({task: 'key_test'}).values();
      let html = `
        <h3>测试结果</h3>
        <table border="1" style="margin:auto; border-collapse:collapse;">
          <tr>
            <th>序号</th>
            <th>应按键</th>
            <th>实际按键</th>
            <th>反应时 (ms)</th>
            <th>是否正确</th>
          </tr>
      `;
      trials.forEach((t, idx) => {
        html += `<tr>
          <td>${idx+1}</td>
          <td>${t.expected_key.toUpperCase()}</td>
          <td>${t.pressed_key ? t.pressed_key.toUpperCase() : ''}</td>
          <td>${Math.round(t.rt)}</td>
          <td>${t.correct ? "✔" : "<span style='color:#C82423;'>✘</span>"}</td>
        </tr>`;
      });
      html += "</table>";
      html += `<button id="export-btn" class="jspsych-btn" style="margin-top:20px;">请点击此处，导出本次数据（CSV）</button>`;
      html += "<p style='font-size:15px;color:#f8f8f8;'>请按esc退出全屏，查看数据文件是否已保存，并联系主试</p>";
      return html;
    },
    choices: ['完成'],
    on_load: function() {
      document.getElementById("export-btn").onclick = exportKeyTestData;
    }
  };
  
  const exit_fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: false,
    message: '',
  };
  
  const end_message = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="text-align:center;">
        <h2>测试结束</h2>
        <p>感谢您的配合！</p>
        <p>可关闭本页面。</p>
      </div>
    `,
    choices: ['关闭页面']
  };
  
  // 6. 组装timeline并运行
  let timeline = [
    experiment_instruction,
    enter_fullscreen,
    instruction,
    ...key_trials,
    show_test_results,
    exit_fullscreen,
    end_message
  ];
  
  jsPsych.run(timeline);