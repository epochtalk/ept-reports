var Joi = require('joi');
var Promise = require('bluebird');

/**
  * @apiVersion 0.4.0
  * @apiGroup Reports
  * @api {GET} /admin/reports/postnotes/:postReportId (Admin) Page Post Report Notes
  * @apiName PagePostReportNotes
  * @apiPermission Super Administrator, Administrator, Global Moderator, Moderator
  * @apiDescription Used to page through post moderation report notes.
  *
  * @apiParam {string} postReportId The unique id of the post report to retrieve notes for
  *
  * @apiParam (Query) {number} page=1 The page of post report notes to retrieve
  * @apiParam (Query) {number} limit=10 The number of post report notes to retrieve per page
  * @apiParam (Query) {boolean} desc=true Boolean indicating whether or not to sort the results in descending order
  *
  * @apiSuccess {object} postReportNotes An object containing post report notes and page data
  * @apiSuccess {number} postReportNotes.count The total number of report notes
  * @apiSuccess {number} postReportNotes.limit The number of report notes to bring back per page
  * @apiSuccess {number} postReportNotes.page The current page of report notes brought back
  * @apiSuccess {number} postReportNotes.page_count The total number of pages
  * @apiSuccess {boolean} postReportNotes.desc Boolean indicating if the results are in descending order
  * @apiSuccess {object[]} postReportNotes.data An array of post report note objects
  * @apiSuccess {string} postReportNotes.data.id The unique id of the post report note
  * @apiSuccess {string} postReportNotes.data.report_id The unique id of the post report this note is for
  * @apiSuccess {string} postReportNotes.data.user_id The unique id of the user who left the note
  * @apiSuccess {string} postReportNotes.data.avatar The URL to the avatar of the user who left the note
  * @apiSuccess {string} postReportNotes.data.note The note message that was left on the report
  * @apiSuccess {timestamp} postReportNotes.data.created_at Timestamp of when the report note was created
  * @apiSuccess {timestamp} postReportNotes.data.updated_at Timestamp of when the report note was last updated
  *
  * @apiError (Error 500) InternalServerError There was an error retrieving the post report notes
  */
module.exports = {
  method: 'GET',
  path: '/api/reports/postnotes/{report_id}',
  config: {
    auth: { strategy: 'jwt' },
    validate: {
      params: { report_id: Joi.string().required() },
      query: {
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        desc: Joi.boolean().default(true)
      }
    },
    pre: [ { method: 'auth.reports.posts.notes.page(server, auth)' } ]
  },
  handler: function(request, reply) {
    var reportId = request.params.report_id;
    var opts = {
      limit: request.query.limit,
      page: request.query.page,
      sortDesc: request.query.desc
    };

    var reportNotes = request.db.reports.pagePostReportsNotes(reportId, opts);
    var reportNotesCount = request.db.reports.postReportsNotesCount(reportId);

    var promise = Promise.join(reportNotes, reportNotesCount, function(notes, count) {
      return {
        data: notes,
        count: count,
        limit: opts.limit,
        page: opts.page,
        page_count: Math.ceil(count / opts.limit),
        desc: opts.desc
      };
    });

    return reply(promise);
  }
};
