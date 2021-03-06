import m from 'mithril';
import _ from 'underscore';
import h from '../h';
import facebookButton from '../c/facebook-button';
import projectShareBox from '../c/project-share-box';
import projectRow from '../c/project-row';
import UserVM from '../vms/user-vm';
import ProjectVM from '../vms/project-vm';
import CommonPaymentVM from '../vms/common-payment-vm.js';

const I18nScope = _.partial(h.i18nScope, 'projects.contributions');
const ProjectsSubscriptionThankYou = {
    controller: function(args) {
        const paymentMethod = m.route.param('payment_method');
        const paymentConfirmed = JSON.parse(m.route.param('payment_confirmed'));
        const paymentId = m.route.param('payment_id');
        const paymentData = m.prop({});
        const error = m.prop(false);
        const projectId = m.route.param('project_id');
        const isEdit = m.route.param('is_edit');
        const project = m.prop({});
        const projectUser = m.prop();
        const recommendedProjects = UserVM.getUserRecommendedProjects();
        const sendSubscriptionDataToAnalyticsInterceptingPaymentInfoRequest = (payData) => {
            const analyticsData = {
                cat: isEdit ? 'subscription_edition' : 'subscription_creation',
                act: isEdit ? 'subscription_edited' : 'subscription_created',
                extraData: {
                    project_id: projectId,
                    subscription_id: payData.subscription_id
                }
            };
            h.analytics.event(analyticsData)();
            return payData;
        };

        if (paymentId) {
            CommonPaymentVM
                .paymentInfo(paymentId)
                .then(sendSubscriptionDataToAnalyticsInterceptingPaymentInfoRequest)
                .then(paymentData).catch(() => error(true));
        }

        ProjectVM
            .fetchProject(projectId, false)
            .then((projectData) => {
                project(_.first(projectData));
                return UserVM.fetchUser(project().user.id, false);
            })
            .then(projectUserData => projectUser(_.first(projectUserData)))
            .catch(() => error(true));

        return {
            displayShareBox: h.toggleProp(false, true),
            recommendedProjects,
            paymentMethod,
            paymentConfirmed,
            project,
            projectUser,
            paymentData,
            error,
            isEdit
        };
    },
    view: function(ctrl, args) {
        const project = ctrl.project();
        const user = h.getUser();
        const projectUser = ctrl.projectUser();

        return m('#thank-you', !project ? h.loader() : [
            m('.page-header.u-marginbottom-30',
                m('.w-container',
                    m('.w-row',
                        m('.w-col.w-col-10.w-col-push-1', [
                            m('.u-marginbottom-20.u-text-center',
                                projectUser ? m(`img.big.thumb.u-round[src='${projectUser.profile_img_thumbnail}']`) : h.loader()
                            ),
                            m('#thank-you.u-text-center', [
                                m('#creditcard-thank-you.fontsize-larger.text-success.u-marginbottom-20',
                                  ctrl.isEdit
                                    ? window.I18n.t('thank_you.subscription_edit.thank_you', I18nScope())
                                    : window.I18n.t('thank_you.thank_you', I18nScope())
                                ),
                                m('.fontsize-base.u-marginbottom-40',
                                    m.trust(
                                        window.I18n.t(
                                            ctrl.isEdit
                                                ? 'thank_you.subscription_edit.text_html'
                                                : ctrl.paymentMethod === 'credit_card'
                                                    ? 'thank_you.thank_you_text_html'
                                                    : ctrl.paymentConfirmed
                                                        ? 'thank_you_slip.thank_you_text_html'
                                                        : 'thank_you.thank_you_slip_unconfirmed_text_html',
                                            I18nScope({
                                                total: project.total_contributions,
                                                email: user.email,
                                                link2: `/pt/users/${user.user_id}/edit#contributions`,
                                                link_email: `/pt/users/${user.user_id}/edit#about_me`
                                            })
                                        )
                                    )
                                ),
                                m('.fontsize-base.fontweight-semibold.u-marginbottom-20',
                                    'Compartilhe com seus amigos e ajude esse projeto a bater a meta!'
                                )
                            ]),
                            m('.w-row', [
                                m('.w-hidden-small.w-hidden-tiny', _.isEmpty(project) ? h.loader() : [
                                    m('.w-sub-col.w-col.w-col-4', m.component(facebookButton, {
                                        url: `https://www.catarse.me/${project.permalink}?ref=ctrse_thankyou&utm_source=facebook.com&utm_medium=social&utm_campaign=project_share`,
                                        big: true
                                    })),
                                    m('.w-sub-col.w-col.w-col-4', m.component(facebookButton, {
                                        messenger: true,
                                        big: true,
                                        url: `https://www.catarse.me/${project.permalink}?ref=ctrse_thankyou&utm_source=facebook.com&utm_medium=messenger&utm_campaign=thanks_share`
                                    })),
                                    m('.w-col.w-col-4', m(`a.btn.btn-large.btn-tweet.u-marginbottom-20[href="https://twitter.com/intent/tweet?text=Acabei%20de%20apoiar%20o%20projeto%20${encodeURIComponent(project.name)}%20https://www.catarse.me/${project.permalink}%3Fref%3Dtwitter%26utm_source%3Dtwitter.com%26utm_medium%3Dsocial%26utm_campaign%3Dproject_share"][target="_blank"]`, [
                                        m('span.fa.fa-twitter'), ' Twitter'
                                    ]))
                                ]),
                                m('.w-hidden-main.w-hidden-medium', [
                                    m('.u-marginbottom-30.u-text-center-small-only', m('button.btn.btn-large.btn-terciary.u-marginbottom-40', {
                                        onclick: ctrl.displayShareBox.toggle
                                    }, 'Compartilhe')),
                                    ctrl.displayShareBox() ? m(projectShareBox, {
                                        project: m.prop({
                                            permalink: project.permalink,
                                            name: project.name
                                        }),
                                        displayShareBox: ctrl.displayShareBox
                                    }) : ''
                                ])
                            ]),
                        ])

                    )
                )
            ),
            ctrl.error()
                ? m('.w-row',
                    m('.w-col.w-col-8.w-col-offset-2',
                        m('.card.card-error.u-radius.zindex-10.u-marginbottom-30.fontsize-smaller', window.I18n.translate('thank_you.thank_you_error', I18nScope()))
                    )
                )
                : ctrl.paymentData().boleto_url
                    ? m('.w-row',
                        m('.w-col.w-col-8.w-col-offset-2',
                            m('iframe.slip', {
                                src: ctrl.paymentData().boleto_url,
                                width: '100%',
                                height: '905px',
                                frameborder: '0',
                                style: 'overflow: hidden;'
                            })
                        )
                    ) : m('.section.u-marginbottom-40',
                        m('.w-container', [
                            m('.fontsize-large.fontweight-semibold.u-marginbottom-30.u-text-center',
                                window.I18n.t('thank_you.project_recommendations', I18nScope())
                            ),
                            m.component(projectRow, {
                                collection: ctrl.recommendedProjects,
                                ref: 'ctrse_thankyou_r'
                            })
                        ])
                    )
        ]);
    }
};

export default ProjectsSubscriptionThankYou;
