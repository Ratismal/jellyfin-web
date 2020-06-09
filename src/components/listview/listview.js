/* eslint-disable indent */

/**
 * Module for display list view.
 * @module components/listview/listview
 */

import itemHelper from 'itemHelper';
import mediaInfo from 'mediaInfo';
import indicators from 'indicators';
import connectionManager from 'connectionManager';
import layoutManager from 'layoutManager';
import globalize from 'globalize';
import datetime from 'datetime';
import 'css!./listview';
import 'emby-ratingbutton';
import 'emby-playstatebutton';

    function getIndex(item, options) {

        if (options.index === 'disc') {

            return item.ParentIndexNumber == null ? '' : globalize.translate('ValueDiscNumber', item.ParentIndexNumber);
        }

        const sortBy = (options.sortBy || '').toLowerCase();
        let code;
        let name;

        if (sortBy.indexOf('sortname') === 0) {

            if (item.Type === 'Episode') {
                return '';
            }

            // SortName
            name = (item.SortName || item.Name || '?')[0].toUpperCase();

            code = name.charCodeAt(0);
            if (code < 65 || code > 90) {
                return '#';
            }

            return name.toUpperCase();
        }
        if (sortBy.indexOf('officialrating') === 0) {

            return item.OfficialRating || globalize.translate('Unrated');
        }
        if (sortBy.indexOf('communityrating') === 0) {

            if (item.CommunityRating == null) {
                return globalize.translate('Unrated');
            }

            return Math.floor(item.CommunityRating);
        }
        if (sortBy.indexOf('criticrating') === 0) {

            if (item.CriticRating == null) {
                return globalize.translate('Unrated');
            }

            return Math.floor(item.CriticRating);
        }
        if (sortBy.indexOf('albumartist') === 0) {

            // SortName
            if (!item.AlbumArtist) {
                return '';
            }

            name = item.AlbumArtist[0].toUpperCase();

            code = name.charCodeAt(0);
            if (code < 65 || code > 90) {
                return '#';
            }

            return name.toUpperCase();
        }
        return '';
    }

    function getImageUrl(item, width) {

        const apiClient = connectionManager.getApiClient(item.ServerId);
        let itemId;

        const options = {
            maxWidth: width * 2,
            type: 'Primary'
        };

        if (item.ImageTags && item.ImageTags.Primary) {
            options.tag = item.ImageTags.Primary;
            itemId = item.Id;
        }

        if (item.AlbumId && item.AlbumPrimaryImageTag) {
            options.tag = item.AlbumPrimaryImageTag;
            itemId = item.AlbumId;
        } else if (item.SeriesId && item.SeriesPrimaryImageTag) {
            options.tag = item.SeriesPrimaryImageTag;
            itemId = item.SeriesId;
        } else if (item.ParentPrimaryImageTag) {
            options.tag = item.ParentPrimaryImageTag;
            itemId = item.ParentPrimaryImageItemId;
        }
        let blurHashes = item.ImageBlurHashes || {};
        let blurhashstr = (blurHashes[options.type] || {})[options.tag];

        if (itemId) {
            return { url: apiClient.getScaledImageUrl(itemId, options), blurhash: blurhashstr };
        }
    }

    function getChannelImageUrl(item, width) {

        const apiClient = connectionManager.getApiClient(item.ServerId);
        const options = {
            maxWidth: width * 2,
            type: 'Primary'
        };

        if (item.ChannelId && item.ChannelPrimaryImageTag) {
            options.tag = item.ChannelPrimaryImageTag;
        }
        let blurHashes = item.ImageBlurHashes || {};
        let blurhashstr = (blurHashes[options.type])[options.tag];

        if (item.ChannelId) {
            return { url: apiClient.getScaledImageUrl(item.ChannelId, options), blurhash: blurhashstr };
        }
    }

    function getTextLinesHtml(textlines, isLargeStyle) {

        let html = '';

        const largeTitleTagName = layoutManager.tv ? 'h2' : 'div';

        for (let i = 0, length = textlines.length; i < length; i++) {

            const text = textlines[i];

            if (!text) {
                continue;
            }

            if (i === 0) {
                if (isLargeStyle) {
                    html += `<${largeTitleTagName} class="listItemBodyText">`;
                } else {
                    html += '<div class="listItemBodyText">';
                }
            } else {
                html += '<div class="secondary listItemBodyText">';
            }
            html += (textlines[i] || '&nbsp;');
            if (i === 0 && isLargeStyle) {
                html += `</${largeTitleTagName}>`;
            } else {
                html += '</div>';
            }
        }

        return html;
    }

    function getRightButtonsHtml(options) {

        let html = '';

        for (let i = 0, length = options.rightButtons.length; i < length; i++) {

            const button = options.rightButtons[i];

            html += `<button is="paper-icon-button-light" class="listItemButton itemAction" data-action="custom" data-customaction="${button.id}" title="${button.title}"><span class="material-icons ${button.icon}"></span></button>`;
        }

        return html;
    }

    function getId(item) {
        return item.Id;
    }

    export function getListViewHtml(options) {

        const items = options.items;

        let groupTitle = '';
        const action = options.action || 'link';

        const isLargeStyle = options.imageSize === 'large';
        const enableOverview = options.enableOverview;

        const clickEntireItem = layoutManager.tv ? true : false;
        const outerTagName = clickEntireItem ? 'button' : 'div';
        const enableSideMediaInfo = options.enableSideMediaInfo != null ? options.enableSideMediaInfo : true;

        let outerHtml = '';

        const enableContentWrapper = options.enableOverview && !layoutManager.tv;
        const containerAlbumArtistIds = (options.containerAlbumArtists || []).map(getId);

        for (let i = 0, length = items.length; i < length; i++) {

            const item = items[i];

            let html = '';

            if (options.showIndex) {

                const itemGroupTitle = getIndex(item, options);

                if (itemGroupTitle !== groupTitle) {

                    if (html) {
                        html += '</div>';
                    }

                    if (i === 0) {
                        html += '<h2 class="listGroupHeader listGroupHeader-first">';
                    } else {
                        html += '<h2 class="listGroupHeader">';
                    }
                    html += itemGroupTitle;
                    html += '</h2>';

                    html += '<div>';

                    groupTitle = itemGroupTitle;
                }
            }

            let cssClass = 'listItem';

            if (options.border || (options.highlight !== false && !layoutManager.tv)) {
                cssClass += ' listItem-border';
            }

            if (clickEntireItem) {
                cssClass += ' itemAction listItem-button';
            }

            if (layoutManager.tv) {
                cssClass += ' listItem-focusscale';
            }

            let downloadWidth = 80;

            if (isLargeStyle) {
                cssClass += ' listItem-largeImage';
                downloadWidth = 500;
            }

            const playlistItemId = item.PlaylistItemId ? (` data-playlistitemid="${item.PlaylistItemId}"`) : '';

            const positionTicksData = item.UserData && item.UserData.PlaybackPositionTicks ? (` data-positionticks="${item.UserData.PlaybackPositionTicks}"`) : '';
            const collectionIdData = options.collectionId ? (` data-collectionid="${options.collectionId}"`) : '';
            const playlistIdData = options.playlistId ? (` data-playlistid="${options.playlistId}"`) : '';
            const mediaTypeData = item.MediaType ? (` data-mediatype="${item.MediaType}"`) : '';
            const collectionTypeData = item.CollectionType ? (` data-collectiontype="${item.CollectionType}"`) : '';
            const channelIdData = item.ChannelId ? (` data-channelid="${item.ChannelId}"`) : '';

            if (enableContentWrapper) {

                cssClass += ' listItem-withContentWrapper';
            }

            html += `<${outerTagName} class="${cssClass}"${playlistItemId} data-action="${action}" data-isfolder="${item.IsFolder}" data-id="${item.Id}" data-serverid="${item.ServerId}" data-type="${item.Type}"${mediaTypeData}${collectionTypeData}${channelIdData}${positionTicksData}${collectionIdData}${playlistIdData}>`;

            if (enableContentWrapper) {

                html += '<div class="listItem-content">';
            }

            if (!clickEntireItem && options.dragHandle) {
                //html += '<button is="paper-icon-button-light" class="listViewDragHandle listItemButton"><span class="material-icons drag_handle"></span></button>';
                // Firefox and Edge are not allowing the button to be draggable
                html += '<span class="listViewDragHandle material-icons listItemIcon listItemIcon-transparent drag_handle"></span>';
            }

            if (options.image !== false) {
                let imgData = options.imageSource === 'channel' ? getChannelImageUrl(item, downloadWidth) : getImageUrl(item, downloadWidth);
                let imgUrl = imgData.url;
                let blurhash = imgData.blurhash;
                let imageClass = isLargeStyle ? 'listItemImage listItemImage-large' : 'listItemImage';

                if (isLargeStyle && layoutManager.tv) {
                    imageClass += ' listItemImage-large-tv';
                }

                const playOnImageClick = options.imagePlayButton && !layoutManager.tv;

                if (!clickEntireItem) {
                    imageClass += ' itemAction';
                }

                const imageAction = playOnImageClick ? 'resume' : action;

                let blurhashAttrib = '';
                if (blurhash && blurhash.length > 0) {
                    blurhashAttrib = `data-blurhash="${blurhash}"`;
                }

                if (imgUrl) {
                    html += `<div data-action="${imageAction}" class="${imageClass} lazy" data-src="${imgUrl}" ${blurhashAttrib} item-icon>`;
                } else {
                    html += `<div class="${imageClass}">`;
                }

                let indicatorsHtml = '';
                indicatorsHtml += indicators.getPlayedIndicatorHtml(item);

                if (indicatorsHtml) {
                    html += `<div class="indicators listItemIndicators">${indicatorsHtml}</div>`;
                }

                if (playOnImageClick) {
                    html += '<button is="paper-icon-button-light" class="listItemImageButton itemAction" data-action="resume"><span class="material-icons listItemImageButton-icon play_arrow"></span></button>';
                }

                const progressHtml = indicators.getProgressBarHtml(item, {
                    containerClass: 'listItemProgressBar'
                });

                if (progressHtml) {
                    html += progressHtml;
                }
                html += '</div>';
            }

            if (options.showIndexNumberLeft) {

                html += '<div class="listItem-indexnumberleft">';
                html += (item.IndexNumber || '&nbsp;');
                html += '</div>';
            }

            const textlines = [];

            if (options.showProgramDateTime) {
                textlines.push(datetime.toLocaleString(datetime.parseISO8601Date(item.StartDate), {

                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                }));
            }

            if (options.showProgramTime) {
                textlines.push(datetime.getDisplayTime(datetime.parseISO8601Date(item.StartDate)));
            }

            if (options.showChannel) {
                if (item.ChannelName) {
                    textlines.push(item.ChannelName);
                }
            }

            let parentTitle = null;

            if (options.showParentTitle) {
                if (item.Type === 'Episode') {
                    parentTitle = item.SeriesName;
                } else if (item.IsSeries || (item.EpisodeTitle && item.Name)) {
                    parentTitle = item.Name;
                }
            }

            let displayName = itemHelper.getDisplayName(item, {
                includeParentInfo: options.includeParentInfoInTitle
            });

            if (options.showIndexNumber && item.IndexNumber != null) {
                displayName = `${item.IndexNumber}. ${displayName}`;
            }

            if (options.showParentTitle && options.parentTitleWithTitle) {

                if (displayName) {

                    if (parentTitle) {
                        parentTitle += ' - ';
                    }
                    parentTitle = (parentTitle || '') + displayName;
                }

                textlines.push(parentTitle || '');
            } else if (options.showParentTitle) {
                textlines.push(parentTitle || '');
            }

            if (displayName && !options.parentTitleWithTitle) {
                textlines.push(displayName);
            }

            if (item.IsFolder) {
                if (options.artist !== false) {

                    if (item.AlbumArtist && item.Type === 'MusicAlbum') {
                        textlines.push(item.AlbumArtist);
                    }
                }
            } else {

                let showArtist = options.artist === true;
                const artistItems = item.ArtistItems;

                if (!showArtist && options.artist !== false) {

                    if (!artistItems || !artistItems.length) {
                        showArtist = true;
                    } else if (artistItems.length > 1 || !containerAlbumArtistIds.includes(artistItems[0].Id)) {
                        showArtist = true;
                    }
                }

                if (showArtist) {

                    if (artistItems && item.Type !== 'MusicAlbum') {
                        textlines.push(artistItems.map(a => {
                            return a.Name;
                        }).join(', '));
                    }
                }
            }

            if (item.Type === 'TvChannel') {

                if (item.CurrentProgram) {
                    textlines.push(itemHelper.getDisplayName(item.CurrentProgram));
                }
            }

            cssClass = 'listItemBody';
            if (!clickEntireItem) {
                cssClass += ' itemAction';
            }

            if (options.image === false) {
                cssClass += ' listItemBody-noleftpadding';
            }

            html += `<div class="${cssClass}">`;

            const moreIcon = 'more_vert';

            html += getTextLinesHtml(textlines, isLargeStyle);

            if (options.mediaInfo !== false) {
                if (!enableSideMediaInfo) {

                    const mediaInfoClass = 'secondary listItemMediaInfo listItemBodyText';

                    html += `<div class="${mediaInfoClass}">`;
                    html += mediaInfo.getPrimaryMediaInfoHtml(item, {
                        episodeTitle: false,
                        originalAirDate: false,
                        subtitles: false

                    });
                    html += '</div>';
                }
            }

            if (enableOverview && item.Overview) {
                html += '<div class="secondary listItem-overview listItemBodyText">';
                html += item.Overview;
                html += '</div>';
            }

            html += '</div>';

            if (options.mediaInfo !== false) {
                if (enableSideMediaInfo) {
                    html += '<div class="secondary listItemMediaInfo">';
                    html += mediaInfo.getPrimaryMediaInfoHtml(item, {

                        year: false,
                        container: false,
                        episodeTitle: false,
                        criticRating: false,
                        endsAt: false

                    });
                    html += '</div>';
                }
            }

            if (!options.recordButton && (item.Type === 'Timer' || item.Type === 'Program')) {
                html += indicators.getTimerIndicator(item).replace('indicatorIcon', 'indicatorIcon listItemAside');
            }

            html += '<div class="listViewUserDataButtons">';

            if (!clickEntireItem) {

                if (options.addToListButton) {
                    html += '<button is="paper-icon-button-light" class="listItemButton itemAction" data-action="addtoplaylist"><span class="material-icons playlist_add"></span></button>';
                }

                if (options.moreButton !== false) {
                    html += `<button is="paper-icon-button-light" class="listItemButton itemAction" data-action="menu"><span class="material-icons ${moreIcon}"></span></button>`;
                }

                if (options.infoButton) {
                    html += '<button is="paper-icon-button-light" class="listItemButton itemAction" data-action="link"><span class="material-icons info_outline"></span></button>';
                }

                if (options.rightButtons) {
                    html += getRightButtonsHtml(options);
                }

                if (options.enableUserDataButtons !== false) {

                    const userData = item.UserData || {};
                    const likes = userData.Likes == null ? '' : userData.Likes;

                    if (itemHelper.canMarkPlayed(item)) {
                        html += `<button is="emby-playstatebutton" type="button" class="listItemButton paper-icon-button-light" data-id="${item.Id}" data-serverid="${item.ServerId}" data-itemtype="${item.Type}" data-played="${userData.Played}"><span class="material-icons check"></span></button>`;
                    }

                    if (itemHelper.canRate(item)) {
                        html += `<button is="emby-ratingbutton" type="button" class="listItemButton paper-icon-button-light" data-id="${item.Id}" data-serverid="${item.ServerId}" data-itemtype="${item.Type}" data-likes="${likes}" data-isfavorite="${userData.IsFavorite}"><span class="material-icons favorite"></span></button>`;
                    }
                }
            }
            html += '</div>';

            if (enableContentWrapper) {
                html += '</div>';

                if (enableOverview && item.Overview) {
                    html += '<div class="listItem-bottomoverview secondary">';
                    html += item.Overview;
                    html += '</div>';
                }
            }

            html += `</${outerTagName}>`;

            outerHtml += html;
        }

        return outerHtml;
    }

/* eslint-enable indent */
export default {
    getListViewHtml: getListViewHtml
};
