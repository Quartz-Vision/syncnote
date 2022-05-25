import localization from '@/localization';


export async function handleError(dispatch, e, timeShow, noThrow=false, ignore={}) {
    let data = e?.response?.data;
    if (ignore[e?.response?.status])
        return;

    // so if there is text-only error, then we can just show a notification
    if (data?.detail || typeof(data) === "string") {
        dispatch('placeNotification', {
            text: localization.state.tr(data?.detail ?? data ?? ''),
            type: "danger",
            time: timeShow || undefined
        }, {root: true});
        
        data = null;
    }
    else {
        for (const [key, err] of Object.entries(data)) {
            if (!Array.isArray(err)) {
                data[key] = [err];
            }
        }
    }

    if (!noThrow) {
        throw data || null;
    }
}


export function calculateNoteSize(note) {
    return note.content.legnth + note.title.length + note.tags.length;
}


export const sort = {
    updatedAtAsc: notes => 
        Object.getOwnPropertyNames(notes).sort(
            (a, b) => notes[a].updatedAt - notes[b].updatedAt
        ),

    updatedAtDesc: notes => 
        Object.getOwnPropertyNames(notes).sort(
            (a, b) => notes[b].updatedAt - notes[a].updatedAt
        ),

    titleAsc: notes => 
        Object.getOwnPropertyNames(notes).sort(
            (a, b) => notes[a].title.localeCompare(notes[b].title)
        ),

    titleDesc: notes => 
        Object.getOwnPropertyNames(notes).sort(
            (a, b) => notes[b].title.localeCompare(notes[a].title)
        ),
};

export const filter = {
    createTagsFilter: filterTags => state => noteId => {
        for (let i = 0; i < filterTags.length; i++) {
            if (!state.tags[filterTags[i]]?.[noteId])
                return false;
        }
        return true;
    },

    createTitleFilter: searchString => state => noteId =>
        state.notes[noteId].title.indexOf(searchString) !== -1,
};
