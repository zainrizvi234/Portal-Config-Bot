require("dotenv").config();
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.action("open_form", async ({ ack, body, client }) => {
  await ack();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "form_submission",
      title: { type: "plain_text", text: "New Config Request" },
      submit: { type: "plain_text", text: "Submit" },
      close: { type: "plain_text", text: "Cancel" },
      blocks: [
        {
          type: "input",
          block_id: "restaurant_name",
          label: { type: "plain_text", text: "Restaurant Name" },
          element: {
            type: "plain_text_input",
            action_id: "value",
            placeholder: { type: "plain_text", text: "e.g. Burger Palace Dublin" }
          }
        },
        {
          type: "input",
          block_id: "brand_id",
          label: { type: "plain_text", text: "Brand ID" },
          element: {
            type: "plain_text_input",
            action_id: "value",
            placeholder: { type: "plain_text", text: "e.g. 12345" }
          }
        },
        {
          type: "input",
          block_id: "portal_link",
          label: { type: "plain_text", text: "Portal Link" },
          element: {
            type: "plain_text_input",
            action_id: "value",
            placeholder: { type: "plain_text", text: "https://..." }
          }
        },
        {
          type: "input",
          block_id: "description",
          label: { type: "plain_text", text: "Description / Request" },
          element: {
            type: "plain_text_input",
            action_id: "value",
            multiline: true,
            placeholder: { type: "plain_text", text: "Describe the config request..." }
          }
        },
        {
          type: "input",
          block_id: "priority",
          label: { type: "plain_text", text: "Priority" },
          element: {
            type: "static_select",
            action_id: "value",
            placeholder: { type: "plain_text", text: "Select priority" },
            options: [
              { text: { type: "plain_text", text: "Low" },    value: "low" },
              { text: { type: "plain_text", text: "Medium" }, value: "medium" },
              { text: { type: "plain_text", text: "High" },   value: "high" },
              { text: { type: "plain_text", text: "Urgent" }, value: "urgent" }
            ]
          }
        },
        {
          type: "input",
          block_id: "screenshots",
          optional: true,
          label: { type: "plain_text", text: "Screenshots / Files" },
          element: {
            type: "plain_text_input",
            action_id: "value",
            placeholder: { type: "plain_text", text: "Paste a link to screenshots or files (optional)" }
          }
        },
        {
          type: "input",
          block_id: "additional_details",
          optional: true,
          label: { type: "plain_text", text: "Additional Details" },
          element: {
            type: "plain_text_input",
            action_id: "value",
            multiline: true,
            placeholder: { type: "plain_text", text: "Anything else to add? (optional)" }
          }
        }
      ]
    }
  });
});

app.view("form_submission", async ({ ack, body, view, client }) => {
  await ack();

  const v = view.state.values;
  const submission = {
    restaurant_name:    v.restaurant_name.value.value,
    brand_id:           v.brand_id.value.value,
    portal_link:        v.portal_link.value.value,
    description:        v.description.value.value,
    priority:           v.priority.value.selected_option.value,
    screenshots:        v.screenshots.value.value || null,
    additional_details: v.additional_details.value.value || null,
  };

  const submittedBy = body.user.id;

  await client.chat.postMessage({
    channel: "team-config",
    text: "New Config Request",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "New Config Request" }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Restaurant Name*\n${submission.restaurant_name}` },
          { type: "mrkdwn", text: `*Brand ID*\n${submission.brand_id}` },
          { type: "mrkdwn", text: `*Priority*\n${submission.priority}` },
          { type: "mrkdwn", text: `*Portal Link*\n${submission.portal_link}` },
        ]
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Description / Request*\n${submission.description}` }
      },
      ...(submission.screenshots ? [{
        type: "section",
        text: { type: "mrkdwn", text: `*Screenshots / Files*\n${submission.screenshots}` }
      }] : []),
      ...(submission.additional_details ? [{
        type: "section",
        text: { type: "mrkdwn", text: `*Additional Details*\n${submission.additional_details}` }
      }] : []),
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Submitted by <@${submittedBy}>` }
        ]
      }
    ]
  });
});

(async () => {
  await app.start();
  console.log("App is running");
})();
