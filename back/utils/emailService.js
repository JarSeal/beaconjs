import CryptoJS from 'crypto-js';
import nodemailer from 'nodemailer';
import { marked } from 'marked';

import config from './config.js';
import logger from './logger.js';
import Email from '../models/email.js';
import { getSettings } from './settingsService.js';
import shared from '../shared/index.js';

const confUI = shared.CONFIG.UI;

const sendEmailById = async (id, emailParams, request) => {
  const settings = await getSettings(request);
  if (!settings['email-sending']) return;

  if (!confUI) {
    logger.error('Undefined configuration, (confUI = shared.CONFIG.UI).');
    return {
      emailSent: false,
      error: 'Undefined config',
    };
  }

  let host, user, pass, from;
  if (
    (!config.EMAIL_HOST && !settings['email-host']) ||
    (!config.EMAIL_USER && !settings['email-username']) ||
    (!config.EMAIL_PASS && !settings['email-password'])
  ) {
    logger.error(
      'Could not setup Nodemailer transporter, because host, email, and/or pass is not set in the env variable nor in the admin settings.'
    );
    return {
      emailSent: false,
      error: 'Invalid or undefined email config',
    };
  } else {
    host =
      !config.EMAIL_HOST && settings['email-host'] && settings['email-host'].trim().length
        ? settings['email-host']
        : config.EMAIL_HOST;
    user =
      !config.EMAIL_USER && settings['email-username'] && settings['email-username'].trim().length
        ? settings['email-username']
        : config.EMAIL_USER;
    pass =
      !config.EMAIL_PASS && settings['email-password'] && settings['email-password'].trim().length
        ? settings['email-password']
        : config.EMAIL_PASS;
    if (settings['email-password'] && settings['email-password'].trim().length) {
      const bytes = CryptoJS.AES.decrypt(pass, process.env.SECRET);
      pass = bytes.toString(CryptoJS.enc.Utf8);
    }
    from = user;
  }

  const transporter = nodemailer.createTransport({
    host,
    auth: {
      user,
      pass,
    },
    port: 587, // port for secure SMTP
    // secureConnection: false, // TLS requires secureConnection to be false
    // tls: {
    //     ciphers:'SSLv3',
    //     rejectUnauthorized: false,
    // },
  });

  const mainUrl = confUI?.baseUrl + confUI?.basePath;
  emailParams.mainBeaconUrl = mainUrl;
  emailParams.newPassRequestUrl = mainUrl + '/u/newpassrequest';

  if (!emailParams.to) {
    logger.error('Email cannot be sent without a "to" address. (+ emailId)', id);
    return {
      emailSent: false,
      error: {
        msg: 'emailParams.to missing',
        toAddressMissing: true,
      },
    };
  }

  // Get the email from mongo here
  const template = await Email.findOne({ emailId: id });
  if (!template) {
    logger.error('Email template not found. (+ emailId)', id);
    return {
      emailSent: false,
      error: {
        msg: 'Email template not found',
        templateNotFound: true,
      },
    };
  }

  // Placeholder replacing happens here (placeholder: $[variableName] ):
  // The variables that match the emailParams will be replaced with the value
  let subjectAndText = template.defaultEmail; // TODO: Do different languages here
  let subject = subjectAndText.subject;
  let text = subjectAndText.text;
  const variables = extractVariables(text).concat(extractVariables(subject));
  if (variables) {
    for (let i = 0; i < variables.length; i++) {
      const v = variables[i];
      const regex = new RegExp('\\$\\[' + v + '\\]', 'g');
      if (emailParams[v]) {
        const replaceWith = emailParams[v];
        subject = subject.replace(regex, replaceWith);
        text = text.replace(regex, replaceWith);
      }
    }
  }

  const mailOptions = {
    from,
    to: emailParams.to,
    subject,
    text,
    html: _wrapHtmlTemplate(marked.parse(text), template.fromName),
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Email with id "${id}" sent.`);
    return {
      emailSent: true,
    };
  } catch (ex) {
    logger.error(`Could not send email (id: ${id}). (+ ex)`, ex);
    return {
      emailSent: false,
      error: ex.error,
    };
  }
};

const extractVariables = (text, startsWith, endsWith) => {
  if (!startsWith) startsWith = '\\$\\[';
  if (!endsWith) endsWith = '\\]';
  const variables = [];
  let releaseValveCounter = 0;
  const _extractText = (strToParse) => {
    releaseValveCounter++;
    let foundVar = strToParse.match(startsWith + '(.*?)' + endsWith);
    if (foundVar && foundVar.length > 1 && releaseValveCounter < 10000) {
      foundVar = foundVar[1];
      if (!variables.includes(foundVar)) variables.push(foundVar);
      _extractText(strToParse.replace('$[' + foundVar + ']'));
    }
  };
  _extractText(text);
  return variables;
};

const _wrapHtmlTemplate = (content, fromName) => {
  const bgColor = '#f7f7f7';
  const html = `
        <div style="margin:0;padding:0;" bgcolor="${bgColor}">
            <style type="text/css">
                p, ol, ul, li, a, b, strong {
                    font-size: 16px !important;
                }
            </style>
            <table width="100%" height="100%" style="min-width:320px" border="0" cellspacing="0" cellpadding="0" bgcolor="${bgColor}" role="presentation">
                <tbody>
                    <tr align="center">
                        <td>
                            <table width="100%" style="max-width:600px" cellspacing="0" cellpadding="0" bgcolor="${bgColor}" role="presentation">
                                <tbody>
                                    <tr>
                                        <td style="padding-top:20px;padding-bottom:20px;padding-left:30px;padding-right:30px;">
                                            <table width="100%" cellspacing="0" cellpadding="0" bgcolor="${bgColor}" role="presentation">
                                                <tbody>
                                                    <tr>
                                                        <td style="font-family:"Segoe UI",Helvetica,Arial,sans-serif!important;">
                                                            <h3 style="margin:10px 0;">${fromName}</h3>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <table width="100%" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF" role="presentation" style="box-sizing:border-box;border-spacing:0;width:100%!important;border-radius:10px!important;border:1px solid #f0f0f0;">
                                                <tbody>
                                                    <tr style="box-sizing:border-box;">
                                                        <td style="font-size:16px;font-family:'Segoe UI',Helvetica,Arial,sans-serif!important;padding-top:10px;padding-bottom:15px;padding-left:30px;padding-right:30px;box-sizing:border-box;">
                                                            ${content}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top:20px;padding-bottom:20px;padding-left:30px;padding-right:30px;">
                                            <table width="100%" cellspacing="0" cellpadding="0" bgcolor="${bgColor}" role="presentation">
                                                <tbody>
                                                    <tr>
                                                        <td align="center" style="font-family:"Segoe UI",Helvetica,Arial,sans-serif!important;">
                                                            <b style="font-size:12px;">${fromName}</b>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
  return html;
};

export { sendEmailById, extractVariables };
