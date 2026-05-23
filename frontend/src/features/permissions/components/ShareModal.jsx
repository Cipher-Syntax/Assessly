import { useEffect, useMemo, useState } from 'react';
import {
    assignRole,
    createToken,
    getAccessSettings,
    listRoles,
    listTokens,
    lookupUser,
    removeRole,
    revokeToken,
    updateAccessSettings,
} from '../services/accessService';

const ACCESS_MODE_OPTIONS = {
    editor: [
        { value: 'restricted', label: 'Restricted' },
        { value: 'link', label: 'Link' },
    ],
    responder: [
        { value: 'restricted', label: 'Restricted' },
        { value: 'link', label: 'Link' },
        { value: 'public', label: 'Public' },
    ],
};

const ROLE_OPTIONS = [
    { value: 'editor', label: 'Editor' },
    { value: 'responder', label: 'Responder' },
];

const formatTimestamp = (value, fallback) => {
    if (!value) {
        return fallback;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return fallback;
    }

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const AccessModeSection = ({ settings, isSaving, error, onChange }) => {
    return (
        <section className="rounded-lg border border-default bg-tertiary p-4">
            <h3 className="text-sm font-semibold text-primary">Access modes</h3>
            <p className="mt-2 text-xs text-secondary">
                Configure how editors and responders can access this form.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs text-secondary">
                    Editor access
                    <select
                        value={settings.editor_access_mode}
                        onChange={(event) => onChange('editor_access_mode', event.target.value)}
                        disabled={isSaving}
                        className="rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {ACCESS_MODE_OPTIONS.editor.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-2 text-xs text-secondary">
                    Responder access
                    <select
                        value={settings.responder_access_mode}
                        onChange={(event) => onChange('responder_access_mode', event.target.value)}
                        disabled={isSaving}
                        className="rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {ACCESS_MODE_OPTIONS.responder.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </section>
    );
};

const PeopleSection = ({
    email,
    role,
    roles,
    isAssigning,
    error,
    onEmailChange,
    onRoleChange,
    onAssign,
    onRemove,
}) => {
    return (
        <section className="rounded-lg border border-default bg-tertiary p-4">
            <h3 className="text-sm font-semibold text-primary">People</h3>
            <p className="mt-2 text-xs text-secondary">
                Assign editor or responder access by email.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="flex flex-1 flex-col gap-2 text-xs text-secondary">
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => onEmailChange(event.target.value)}
                        placeholder="name@company.com"
                        className="rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none"
                    />
                </label>
                <label className="flex flex-col gap-2 text-xs text-secondary">
                    Role
                    <select
                        value={role}
                        onChange={(event) => onRoleChange(event.target.value)}
                        className="rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary focus:border-focus focus:outline-none"
                    >
                        {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    onClick={onAssign}
                    disabled={isAssigning}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${isAssigning
                        ? 'bg-secondary text-muted opacity-70 cursor-not-allowed'
                        : 'bg-primary-500 text-primary hover:bg-primary-600'
                        }`}
                >
                    {isAssigning ? 'Assigning...' : 'Assign'}
                </button>
            </div>
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            <div className="mt-4 flex flex-col gap-2">
                {roles.length === 0 && (
                    <p className="text-xs text-secondary">No assigned collaborators yet.</p>
                )}
                {roles.map((item) => (
                    <div
                        key={`${item.user_id}-${item.role}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-default bg-secondary px-3 py-2"
                    >
                        <div>
                            <p className="text-sm text-primary">{item.email}</p>
                            <p className="text-xs text-secondary">
                                {item.role === 'editor' ? 'Editor' : 'Responder'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(item.user_id)}
                            className="text-xs font-semibold text-secondary transition hover:text-primary"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
};

const TokenPanel = ({
    title,
    scope,
    tokens,
    isCreating,
    revokingTokenId,
    revealedToken,
    copyStatus,
    onCopyToken,
    onCreate,
    onRevoke,
}) => {
    return (
        <div className="rounded-lg border border-default bg-tertiary p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h4 className="text-sm font-semibold text-primary">{title}</h4>
                    <p className="mt-1 text-xs text-secondary">
                        Generate a shareable link token for {title.toLowerCase()} access.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onCreate(scope)}
                    disabled={isCreating}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${isCreating
                        ? 'bg-secondary text-muted opacity-70 cursor-not-allowed'
                        : 'bg-primary-500 text-primary hover:bg-primary-600'
                        }`}
                >
                    {isCreating ? 'Generating...' : 'Generate link'}
                </button>
            </div>
            {revealedToken && revealedToken.scope === scope && (
                <div className="mt-4 rounded-lg border border-default bg-secondary p-3">
                    <p className="text-xs text-secondary">
                        New token (shown once). Copy it now and store it securely.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <code className="break-all rounded bg-tertiary px-2 py-1 text-xs text-primary">
                            {revealedToken.token}
                        </code>
                        <button
                            type="button"
                            onClick={() => onCopyToken(revealedToken.token)}
                            className="rounded-lg border border-default bg-tertiary px-2 py-1 text-xs font-semibold text-secondary transition hover:text-primary"
                        >
                            Copy
                        </button>
                        {copyStatus && (
                            <span className="text-xs text-secondary">{copyStatus}</span>
                        )}
                    </div>
                </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
                {tokens.length === 0 && (
                    <p className="text-xs text-secondary">No tokens yet.</p>
                )}
                {tokens.map((token) => (
                    <div
                        key={token.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-default bg-secondary px-3 py-2"
                    >
                        <div>
                            <p className="text-xs text-secondary">Scope</p>
                            <p className="text-sm text-primary">
                                {token.scope === 'editor' ? 'Editor' : 'Responder'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-secondary">Created</p>
                            <p className="text-xs text-primary">
                                {formatTimestamp(token.created_at, 'Unknown')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-secondary">Last used</p>
                            <p className="text-xs text-primary">
                                {formatTimestamp(token.last_used_at, 'Never')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-secondary">Status</p>
                            <p
                                className={`text-xs font-semibold ${token.is_active ? 'text-success' : 'text-muted'
                                    }`}
                            >
                                {token.is_active ? 'Active' : 'Revoked'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRevoke(token.id)}
                            disabled={!token.is_active || revokingTokenId === token.id}
                            className={`text-xs font-semibold transition ${!token.is_active || revokingTokenId === token.id
                                ? 'text-muted cursor-not-allowed'
                                : 'text-secondary hover:text-primary'
                                }`}
                        >
                            {revokingTokenId === token.id ? 'Revoking...' : 'Revoke'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TokenSection = ({
    tokens,
    createState,
    revealedToken,
    revokingTokenId,
    error,
    onCreate,
    onRevoke,
    onCopyToken,
    copyStatus,
}) => {
    const editorTokens = useMemo(
        () => tokens.filter((token) => token.scope === 'editor'),
        [tokens]
    );
    const responderTokens = useMemo(
        () => tokens.filter((token) => token.scope === 'responder'),
        [tokens]
    );

    return (
        <section className="rounded-lg border border-default bg-tertiary p-4">
            <h3 className="text-sm font-semibold text-primary">Link tokens</h3>
            <p className="mt-2 text-xs text-secondary">
                Create and revoke secure tokens for link-based access.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TokenPanel
                    title="Editor"
                    scope="editor"
                    tokens={editorTokens}
                    isCreating={createState.editor}
                    revokingTokenId={revokingTokenId}
                    revealedToken={revealedToken}
                    copyStatus={copyStatus}
                    onCopyToken={onCopyToken}
                    onCreate={onCreate}
                    onRevoke={onRevoke}
                />
                <TokenPanel
                    title="Responder"
                    scope="responder"
                    tokens={responderTokens}
                    isCreating={createState.responder}
                    revokingTokenId={revokingTokenId}
                    revealedToken={revealedToken}
                    copyStatus={copyStatus}
                    onCopyToken={onCopyToken}
                    onCreate={onCreate}
                    onRevoke={onRevoke}
                />
            </div>
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </section>
    );
};

const ShareModal = ({ formId, isOpen, onClose }) => {
    const [status, setStatus] = useState('idle');
    const [loadError, setLoadError] = useState('');
    const [accessError, setAccessError] = useState('');
    const [peopleError, setPeopleError] = useState('');
    const [tokenError, setTokenError] = useState('');
    const [accessSettings, setAccessSettings] = useState({
        editor_access_mode: 'restricted',
        responder_access_mode: 'restricted',
    });
    const [roles, setRoles] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [isSavingAccess, setIsSavingAccess] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('editor');
    const [createState, setCreateState] = useState({ editor: false, responder: false });
    const [revokingTokenId, setRevokingTokenId] = useState(null);
    const [revealedToken, setRevealedToken] = useState(null);
    const [copyStatus, setCopyStatus] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setLoadError('');
            setAccessError('');
            setPeopleError('');
            setTokenError('');
            setRevealedToken(null);
            setCopyStatus('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !formId) {
            return undefined;
        }

        let isMounted = true;

        const loadData = async () => {
            setStatus('loading');
            setLoadError('');

            const [settingsResult, rolesResult, tokensResult] = await Promise.all([
                getAccessSettings(formId),
                listRoles(formId),
                listTokens(formId),
            ]);

            if (!isMounted) {
                return;
            }

            if (settingsResult.settings) {
                setAccessSettings(settingsResult.settings);
            }

            if (rolesResult.roles) {
                setRoles(rolesResult.roles);
            }

            if (tokensResult.tokens) {
                setTokens(tokensResult.tokens);
            }

            const error = settingsResult.error || rolesResult.error || tokensResult.error;
            setLoadError(error || '');
            setStatus('ready');
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [isOpen, formId]);

    const handleAccessChange = async (field, value) => {
        if (!formId) {
            return;
        }

        const nextSettings = { ...accessSettings, [field]: value };
        setAccessSettings(nextSettings);
        setAccessError('');
        setIsSavingAccess(true);

        const { settings, error } = await updateAccessSettings(formId, nextSettings);

        if (error || !settings) {
            setAccessSettings(accessSettings);
            setAccessError(error || 'Unable to update access settings.');
        } else {
            setAccessSettings(settings);
        }

        setIsSavingAccess(false);
    };

    const handleAssign = async () => {
        if (!formId || isAssigning) {
            return;
        }

        setPeopleError('');
        setIsAssigning(true);

        const { user, error: lookupError } = await lookupUser(formId, email.trim());

        if (!user) {
            setPeopleError(lookupError || 'Unable to find that email.');
            setIsAssigning(false);
            return;
        }

        const { role: assignedRole, error } = await assignRole(
            formId,
            user.user_id,
            role
        );

        if (!assignedRole) {
            setPeopleError(error || 'Unable to assign role.');
            setIsAssigning(false);
            return;
        }

        setRoles((prev) => {
            const index = prev.findIndex((item) => item.user_id === assignedRole.user_id);
            if (index === -1) {
                return [...prev, assignedRole];
            }
            const next = [...prev];
            next[index] = assignedRole;
            return next;
        });
        setEmail('');
        setIsAssigning(false);
    };

    const handleRemove = async (userId) => {
        if (!formId) {
            return;
        }

        setPeopleError('');
        const { success, error } = await removeRole(formId, userId);

        if (!success) {
            setPeopleError(error || 'Unable to remove that role.');
            return;
        }

        setRoles((prev) => prev.filter((item) => item.user_id !== userId));
    };

    const handleCreateToken = async (scope) => {
        if (!formId) {
            return;
        }

        setTokenError('');
        setCreateState((prev) => ({ ...prev, [scope]: true }));

        const { token, error } = await createToken(formId, scope);

        if (!token) {
            setTokenError(error || 'Unable to generate token.');
            setCreateState((prev) => ({ ...prev, [scope]: false }));
            return;
        }

        setTokens((prev) => [
            {
                id: token.id,
                scope: token.scope,
                is_active: token.is_active,
                expires_at: token.expires_at,
                created_at: token.created_at,
                last_used_at: token.last_used_at,
            },
            ...prev,
        ]);
        setRevealedToken({ scope: token.scope, token: token.token });
        setCopyStatus('');
        setCreateState((prev) => ({ ...prev, [scope]: false }));
    };

    const handleRevokeToken = async (tokenId) => {
        if (!formId) {
            return;
        }

        setTokenError('');
        setRevokingTokenId(tokenId);

        const { token, error } = await revokeToken(formId, tokenId);

        if (!token) {
            setTokenError(error || 'Unable to revoke that token.');
            setRevokingTokenId(null);
            return;
        }

        setTokens((prev) =>
            prev.map((item) => (item.id === token.id ? { ...item, ...token } : item))
        );
        setRevokingTokenId(null);
    };

    const handleCopyToken = async (tokenValue) => {
        if (!tokenValue) {
            return;
        }

        try {
            await navigator.clipboard.writeText(tokenValue);
            setCopyStatus('Copied');
        } catch {
            setCopyStatus('Copy failed');
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
            <div className="flex w-full max-w-4xl max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-xl border border-default bg-secondary shadow-lg">
                <div className="flex items-start justify-between gap-4 border-b border-default px-6 py-4">
                    <div>
                        <h2 className="text-xl font-semibold text-primary">Share access</h2>
                        <p className="mt-1 text-sm text-secondary">
                            Manage who can edit or respond to this form.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm font-semibold text-secondary transition hover:text-primary"
                    >
                        Close
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                    {status === 'loading' && (
                        <p className="text-sm text-secondary">
                            Loading access controls...
                        </p>
                    )}

                    {loadError && (
                        <div className="rounded-lg border border-default bg-tertiary px-4 py-3 text-sm text-secondary">
                            {loadError}
                        </div>
                    )}

                    {status === 'ready' && (
                        <div className="flex flex-col gap-6">
                            <AccessModeSection
                                settings={accessSettings}
                                isSaving={isSavingAccess}
                                error={accessError}
                                onChange={handleAccessChange}
                            />
                            <PeopleSection
                                email={email}
                                role={role}
                                roles={roles}
                                isAssigning={isAssigning}
                                error={peopleError}
                                onEmailChange={setEmail}
                                onRoleChange={setRole}
                                onAssign={handleAssign}
                                onRemove={handleRemove}
                            />
                            <TokenSection
                                tokens={tokens}
                                createState={createState}
                                revealedToken={revealedToken}
                                revokingTokenId={revokingTokenId}
                                error={tokenError}
                                onCreate={handleCreateToken}
                                onRevoke={handleRevokeToken}
                                onCopyToken={handleCopyToken}
                                copyStatus={copyStatus}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
