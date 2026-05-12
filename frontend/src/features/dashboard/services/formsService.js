import api from '../../../services/api';

const normalizeForm = (item) => {
    const id = Number(item?.id);
    const publishedVersionId = Number(item?.published_version_id);
    const title = typeof item?.title === 'string' ? item.title.trim() : '';

    return {
        id: Number.isFinite(id) ? id : 0,
        title: title ? title : 'Untitled form',
        isPublished: Boolean(item?.is_published),
        updatedAt: typeof item?.updated_at === 'string' ? item.updated_at : null,
        publishedVersionId: Number.isFinite(publishedVersionId) ? publishedVersionId : null,
    };
};

export const getForms = async () => {
    const response = await api.get('/api/forms/');
    const data = response?.data;
    const forms = Array.isArray(data) ? data : [];

    return forms.map(normalizeForm);
};
