/* ══════════════════════════════════════════════════════════════════
   Job Resume Tailor — main.js
   ══════════════════════════════════════════════════════════════════ */

const PROMPT_TEMPLATE =
'I want to tailor my resume for a specific job. Here is the job description:\n\n' +
'{{JOB_DESCRIPTION}}\n\n' +
'Please optimize my resume for this job by doing the following:\n\n' +
'Do not fabricate anything — do not invent or exaggerate skills, tools, or experience I don\'t have. Use only what\'s already in my resume.\n\n' +
'Identify the top 5 responsibilities, skills, or values the job is emphasizing, and ensure my professional summary reflects that I offer those exact things.\n\n' +
'Ensure the work experience section is aligned with the job description:\n' +
'- Emphasize relevant experience\n' +
'- Use clear, measurable achievements\n' +
'- Match my real work to the job\'s language and structure (e.g., project lifecycle, tools used, stakeholder impact)\n\n' +
'Optimize for ATS (Applicant Tracking Systems) — clean formatting, role-relevant keywords, clear section headers.\n\n' +
'Highlight any certifications, tools, or methodologies listed in the job that I already possess (e.g., PMP, Jira, Agile, Salesforce).\n\n' +
'Keep the resume professional, easy to scan, and job-ready.\n\n' +
'Final deliverable: An optimized resume that truthfully reflects my background and is tailored to this specific job.';

const RESUME_SUFFIX = '\n\nHere is my current resume:\n\n{{RESUME_TEXT}}';

function getResumeMode() {
  const checked = document.querySelector('input[name="resume-mode"]:checked');
  return checked ? checked.value : 'upload';
}

function generatePrompt(jobDescription, resumeText) {
  let prompt = PROMPT_TEMPLATE.replace('{{JOB_DESCRIPTION}}', jobDescription.trim());
  if (resumeText && resumeText.trim()) {
    prompt += RESUME_SUFFIX.replace('{{RESUME_TEXT}}', resumeText.trim());
  }
  return prompt;
}

function setOutput(promptText, mode) {
  document.getElementById('prompt-output').textContent = promptText;
  document.getElementById('output-section').classList.remove('hidden');

  // Update tip based on mode
  const tip = document.getElementById('output-tip');
  if (mode === 'paste') {
    tip.innerHTML = 'Your resume is already included at the end of this prompt. ' +
      'Just paste the whole thing into <strong class="text-on-surface-variant">ChatGPT</strong> and it will handle the rest.';
  } else {
    tip.innerHTML = 'Paste this prompt into ChatGPT, then attach your resume using the ' +
      '<strong class="text-on-surface-variant">paperclip icon</strong> (or paste your resume text after the prompt).';
  }

  document.getElementById('output-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Activate step pills 2 & 3
  const p2 = document.getElementById('step2-pill');
  const p3 = document.getElementById('step3-pill');
  if (p2) p2.classList.add('active');
  if (p3) p3.classList.add('active');
}

function copyText(text, btn, originalHTML) {
  navigator.clipboard.writeText(text).then(function () {
    btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Copied!';
    setTimeout(function () { btn.innerHTML = originalHTML; }, 2000);
  }).catch(function () {
    alert('Copy failed — please select the text manually.');
  });
}

function validateForm() {
  const hasJob    = document.getElementById('input-job-text').value.trim().length > 0;
  const mode      = getResumeMode();
  const hasResume = mode === 'upload' || document.getElementById('input-resume-text').value.trim().length > 0;
  document.getElementById('btn-generate').disabled = !(hasJob && hasResume);
}

function init() {
  const jobTextarea    = document.getElementById('input-job-text');
  const resumeTextarea = document.getElementById('input-resume-text');
  const genBtn         = document.getElementById('btn-generate');
  const copyBtn        = document.getElementById('btn-copy');
  const copyInline     = document.getElementById('btn-copy-inline');
  const pillUpload     = document.getElementById('pill-upload');
  const pillPaste      = document.getElementById('pill-paste');
  const resumeWrap     = document.getElementById('resume-paste-wrap');

  // Radio pill toggle
  document.querySelectorAll('input[name="resume-mode"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      const isPaste = radio.value === 'paste';
      pillUpload.classList.toggle('selected', !isPaste);
      pillPaste.classList.toggle('selected',  isPaste);
      resumeWrap.classList.toggle('hidden',   !isPaste);
      validateForm();
    });
  });

  // Also allow clicking the label itself to switch (visual feedback)
  pillUpload.addEventListener('click', function () {
    pillUpload.querySelector('input').checked = true;
    pillUpload.querySelector('input').dispatchEvent(new Event('change'));
  });
  pillPaste.addEventListener('click', function () {
    pillPaste.querySelector('input').checked = true;
    pillPaste.querySelector('input').dispatchEvent(new Event('change'));
  });

  // Validate on input
  jobTextarea.addEventListener('input', validateForm);
  resumeTextarea.addEventListener('input', validateForm);

  // Generate the prompt
  genBtn.addEventListener('click', function () {
    const job    = jobTextarea.value.trim();
    const mode   = getResumeMode();
    const resume = mode === 'paste' ? resumeTextarea.value : '';
    if (!job) return;
    setOutput(generatePrompt(job, resume), mode);
  });

  // Copy buttons
  copyBtn.addEventListener('click', function () {
    const text = document.getElementById('prompt-output').textContent;
    copyText(text, copyBtn,
      '<span class="material-symbols-outlined text-sm">content_copy</span> Copy Prompt');
  });

  copyInline.addEventListener('click', function () {
    const text = document.getElementById('prompt-output').textContent;
    copyText(text, copyInline,
      '<span class="material-symbols-outlined text-sm">content_copy</span> Copy');
  });

  validateForm();
}

document.addEventListener('DOMContentLoaded', init);
