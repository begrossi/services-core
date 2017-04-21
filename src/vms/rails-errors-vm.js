import _ from 'underscore';
import m from 'mithril';

const railsErrors = m.prop('');
const setRailsErrors = errors => railsErrors(errors);
const errorGroups = {
    basics: ['public_name', 'permalink', 'category_id', 'city', 'public_tags', 'name'],
    goal: ['goal', 'online_days'],
    description: ['about_html'],
    budget: ['budget'],
    announce_expiration: ['online_days'],
    card: ['uploaded_image', 'headline'],
    video: ['video_url'],
    reward: ['rewards.size', 'rewards.minimum_value', 'rewards.title', 'rewards.description', 'rewards.deliver_at', 'rewards.shipping_fees.value', 'rewards.shipping_fees.destination'],
    user_about: ['user.uploaded_image', 'user.public_name', 'user.about_html']
        // user_settings: user_settings_error_group
};
const errorsFor = (group) => {
    let parsedErrors;
    try {
        parsedErrors = JSON.parse(railsErrors());
    } catch (err) {
        parsedErrors = {};
    }
    if (_.find(errorGroups[group], key => parsedErrors.hasOwnProperty(key))) { return m('span.fa.fa-exclamation-circle.fa-fw.fa-lg.text-error'); }
    if (_.isEmpty(parsedErrors)) { return ''; }
    return m('span.fa.fa-check-circle.fa-fw.fa-lg.text-success');
};

const mapRailsErrors = (rails_errors, errors_fields, e) => {
    let parsedErrors;
    try {
        parsedErrors = JSON.parse(rails_errors);
    } catch (err) {
        parsedErrors = {};
    }
    const extractAndSetErrorMsg = (label, fieldArray) => {
        const value = _.first(_.compact(_.map(fieldArray, field => _.first(parsedErrors[field]))));

        if (value) {
            e(label, value);
            e.inlineError(label, true);
        }
    };

    _.each(errors_fields, (item, i) => {
        extractAndSetErrorMsg(item[0], item[1]);
    });
};

const railsErrorsVM = {
    errorsFor,
    setRailsErrors,
    mapRailsErrors
};

export default railsErrorsVM;
