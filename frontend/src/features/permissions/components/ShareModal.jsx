import { useEffect, useMemo, useState } from 'react';
import { X, Link as LinkIcon, UserPlus, Settings, Check, Copy, Trash2 } from 'lucide-react';
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
        <section className="py-2">
            <div className="flex items-center gap-2 mb-4">
                <Settings size={18} className="text-secondary" />
                <h3 className="text-base font-medium text-primary">General access</h3>
            </div>
            
            <div className="ml-7 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-primary">Responders</div>
                        <div className="text-xs text-secondary">Who can fill out this form</div>
                    </div>
                    <select
                        value={settings.responder_access_mode}
                        onChange={(event) => onChange('responder_access_mode', event.target.value)}
                        disabled={isSaving}
                        className="rounded-md border border-default bg-transparent px-3 py-1.5 text-sm text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                    >
                        {ACCESS_MODE_OPTIONS.responder.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-primary">Editors</div>
                        <div className="text-xs text-secondary">Who can modify this form</div>
                    </div>
                    <select
                        value={settings.editor_access_mode}
                        onChange={(event) => onChange('editor_access_mode', event.target.value)}
                        disabled={isSaving}
                        className="rounded-md border border-default bg-transparent px-3 py-1.5 text-sm text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                    >
                        {ACCESS_MODE_OPTIONS.editor.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {error && <p className="mt-3 ml-7 text-xs text-danger">{error}</p>}
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
        <section className="py-4 border-t border-default">
            <div className="flex items-center gap-2 mb-4">
                <UserPlus size={18} className="text-secondary" />
                <h3 className="text-base font-medium text-primary">People with access</h3>
            </div>
            
            <div className="ml-7">
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => onEmailChange(event.target.value)}
                            placeholder="Add people and groups"
                            className="w-full rounded-md border border-default bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                        />
                    </div>
                    <select
                        value={role}
                        onChange={(event) => onRoleChange(event.target.value)}
                        className="w-32 rounded-md border border-default bg-transparent px-3 py-2 text-sm text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                    >
                        {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={onAssign}
                        disabled={isAssigning || !email}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${isAssigning || !email
                            ? 'bg-tertiary text-muted cursor-not-allowed'
                            : 'bg-primary-500 text-white hover:bg-primary-600'
                            }`}
                    >
                        {isAssigning ? 'Adding...' : 'Send'}
                    </button>
                </div>
                {error && <p className="mt-2 text-xs text-danger">{error}</p>}

                <div className="mt-6 flex flex-col gap-3">
                    {roles.length === 0 && (
                        <p className="text-sm text-secondary italic">No one has been added yet.</p>
                    )}
                    {roles.map((item) => (
                        <div
                            key={`${item.user_id}-${item.role}`}
                            className="flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                                    {item.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-sm text-primary">{item.email}</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-secondary">
                                    {item.role === 'editor' ? 'Editor' : 'Responder'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(item.user_id)}
                                    className="text-secondary hover:text-danger p-1 rounded-full hover:bg-tertiary transition opacity-0 group-hover:opacity-100"
                                    title="Remove access"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
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
    resolveTokenValue,
}) => {
    const isResponderScope = scope === 'responder';
    const resolvedTokenValue =
        revealedToken && revealedToken.scope === scope
            ? resolveTokenValue(scope, revealedToken.token)
            : '';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium text-primary">{title} link</div>
                    <div className="text-xs text-secondary">Generate a shareable link for {title.toLowerCase()}s</div>
                </div>
                <button
                    type="button"
                    onClick={() => onCreate(scope)}
                    disabled={isCreating}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
                >
                    {isCreating ? 'Generating...' : 'Create link'}
                </button>
            </div>
            
            {revealedToken && revealedToken.scope === scope && (
                <div className="rounded-md border border-primary-200 bg-primary-50 p-3 flex flex-col gap-2">
                    <p className="text-xs text-primary-700">
                        {isResponderScope
                            ? 'New responder link generated. Copy it now.'
                            : 'New editor token generated. Store it securely.'}
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 truncate rounded bg-white px-2 py-1.5 text-xs text-primary border border-primary-100 font-mono">
                            {resolvedTokenValue}
                        </div>
                        <button
                            type="button"
                            onClick={() => onCopyToken(revealedToken.token, scope)}
                            className="flex items-center gap-1 rounded border border-primary-200 bg-white px-2 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 transition"
                        >
                            {copyStatus === 'Copied' ? <Check size={14} /> : <Copy size={14} />}
                            {copyStatus === 'Copied' ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            )}
            
            {tokens.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    {tokens.map((token) => (
                        <div
                            key={token.id}
                            className="flex items-center justify-between py-2 border-b border-tertiary last:border-0"
                        >
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-primary">
                                    {formatTimestamp(token.created_at, 'Unknown')}
                                </span>
                                <span className={`text-[10px] ${token.is_active ? 'text-success' : 'text-muted'}`}>
                                    {token.is_active ? 'Active' : 'Revoked'} • Last used: {formatTimestamp(token.last_used_at, 'Never')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onRevoke(token.id)}
                                disabled={!token.is_active || revokingTokenId === token.id}
                                className={`text-xs font-medium transition ${!token.is_active || revokingTokenId === token.id
                                    ? 'text-muted cursor-not-allowed'
                                    : 'text-danger hover:text-danger-dark'
                                    }`}
                            >
                                {revokingTokenId === token.id ? 'Revoking...' : 'Revoke'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
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
    resolveTokenValue,
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
        <section className="py-4 border-t border-default">
            <div className="flex items-center gap-2 mb-4">
                <LinkIcon size={18} className="text-secondary" />
                <h3 className="text-base font-medium text-primary">Links</h3>
            </div>
            
            <div className="ml-7 flex flex-col gap-6">
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
                    resolveTokenValue={resolveTokenValue}
                />
                
                <div className="h-px bg-tertiary w-full"></div>
                
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
                    resolveTokenValue={resolveTokenValue}
                />
            </div>
            {error && <p className="mt-3 ml-7 text-xs text-danger">{error}</p>}
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

    const resolveTokenValue = (scope, tokenValue) => {
        if (!tokenValue) {
            return '';
        }

        if (scope === 'responder' && formId) {
            return `${window.location.origin}/forms/${formId}/view?token=${tokenValue}`;
        }

        return tokenValue;
    };

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

    const handleCopyToken = async (tokenValue, scope) => {
        if (!tokenValue) {
            return;
        }

        try {
            await navigator.clipboard.writeText(resolveTokenValue(scope, tokenValue));
            setCopyStatus('Copied');
        } catch {
            setCopyStatus('Copy failed');
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 backdrop-blur-sm p-4">
            <div className="flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl bg-secondary shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-default">
                    <h2 className="text-xl font-normal text-primary">Share form</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-secondary hover:bg-tertiary p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                    {status === 'loading' && (
                        <div className="flex items-center justify-center py-10">
                            <p className="text-sm text-secondary">Loading...</p>
                        </div>
                    )}

                    {loadError && (
                        <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">
                            {loadError}
                        </div>
                    )}

                    {status === 'ready' && (
                        <div className="flex flex-col">
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
                                resolveTokenValue={resolveTokenValue}
                            />
                        </div>
                    )}
                </div>
                
                <div className="border-t border-default px-6 py-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full px-6 py-2 text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
