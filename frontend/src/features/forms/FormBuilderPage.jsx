import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import SectionCard from './components/SectionCard';
import AddQuestionBar from './components/AddQuestionBar';
import { QuestionCardPreview } from './components/QuestionCard';
import useFormBuilder from './hooks/useFormBuilder';
import ShareModal from '../permissions/components/ShareModal';
import ResponsesPanel from '../responses/components/ResponsesPanel';
import SettingsPanel from './components/SettingsPanel';
import PageSpinner from '../../components/ui/PageSpinner';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../app/useToast';
import AiGenerateModal from './components/AiGenerateModal';
import api from '../../services/api';

const FormBuilderPage = () => {
    const { id } = useParams();
    const {
        status,
        loadError,
        title,
        description,
        settings,
        sections,
        publishedVersion,
        isEditingDraft,
        isSaving,
        isPublishing,
        lastSavedAt,
        saveError,
        validationErrors,
        actions,
    } = useFormBuilder({ formId: id });

    const [activeSectionId, setActiveSectionId] = useState(null);
    const [activeQuestionId, setActiveQuestionId] = useState(null);
    const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('builder');
    const [isAiGenerateOpen, setIsAiGenerateOpen] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const toast = useToast();
    const hasLoadedRef = useRef(false);
    const lastSaveToastRef = useRef(0);
    const lastPublishedIdRef = useRef(publishedVersion?.id ?? null);
    const wasPublishingRef = useRef(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );

    const activeQuestion = useMemo(() => {
        if (!activeQuestionId) {
            return null;
        }

        for (const section of sections) {
            const question = section.questions.find(
                (item) => item.id === activeQuestionId
            );
            if (question) {
                return question;
            }
        }

        return null;
    }, [activeQuestionId, sections]);

    const currentSectionId = useMemo(() => {
        if (activeSectionId && sections.some((s) => s.id === activeSectionId)) {
            return activeSectionId;
        }
        return sections[sections.length - 1]?.id;
    }, [activeSectionId, sections]);

    const handleDragStart = (event) => {
        if (!isEditingDraft || isPublishing) {
            return;
        }
        setActiveQuestionId(event.active?.id ?? null);
    };

    const handleDragCancel = () => {
        setActiveQuestionId(null);
    };

    const handleAiGenerate = async (prompt) => {
        setIsAiGenerating(true);
        try {
            await api.post(`/api/forms/${id}/ai_generate/`, { prompt });
            toast.success("AI generated questions successfully!");
            // Give it a brief moment to finish saving locally before reload
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            toast.error("Error generating questions.");
            setIsAiGenerating(false);
        }
    };

    const handleDragEnd = (event) => {
        if (!isEditingDraft || isPublishing) {
            setActiveQuestionId(null);
            return;
        }
        const { active, over } = event;
        setActiveQuestionId(null);

        if (!active || !over) {
            return;
        }

        const activeData = active.data?.current;
        const overData = over.data?.current;

        if (!activeData?.sectionId || !activeData?.questionId) {
            return;
        }

        const sourceSectionId = activeData.sectionId;
        if (!overData?.sectionId) {
            return;
        }

        const targetSectionId = overData.sectionId;

        const targetSection = sections.find(
            (section) => section.id === targetSectionId
        );

        if (!targetSection) {
            return;
        }

        let targetIndex = targetSection.questions.length;

        if (overData?.questionId) {
            const overIndex = targetSection.questions.findIndex(
                (question) => question.id === overData.questionId
            );
            if (overIndex !== -1) {
                targetIndex = overIndex;
            }
        }

        actions.moveQuestion(
            sourceSectionId,
            targetSectionId,
            activeData.questionId,
            targetIndex
        );
    };

    useEffect(() => {
        if (status === 'ready' && !hasLoadedRef.current) {
            hasLoadedRef.current = true;
        }
    }, [status]);

    useEffect(() => {
        if (!hasLoadedRef.current || !lastSavedAt) {
            return;
        }

        const now = Date.now();
        if (now - lastSaveToastRef.current < 10000) {
            return;
        }

        toast.success('Draft saved.');
        lastSaveToastRef.current = now;
    }, [lastSavedAt, toast]);

    useEffect(() => {
        if (isPublishing) {
            wasPublishingRef.current = true;
            return;
        }

        if (!wasPublishingRef.current) {
            return;
        }

        wasPublishingRef.current = false;

        if (publishedVersion && publishedVersion.id !== lastPublishedIdRef.current) {
            lastPublishedIdRef.current = publishedVersion.id;
            toast.success('Form published.');
        }
    }, [isPublishing, publishedVersion, toast]);

    if (status === 'loading') {
        return <PageSpinner message="Loading form..." />;
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-primary text-primary flex items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-xl rounded-xl border border-default bg-secondary px-6 py-6 text-center">
                    <h1 className="text-lg font-semibold text-primary">
                        Unable to load form
                    </h1>
                    <p className="mt-2 text-sm text-secondary">
                        {loadError || 'Please try again in a moment.'}
                    </p>
                </div>
            </div>
        );
    }

    const statusLabel = !isEditingDraft
        ? 'Draft locked'
        : isPublishing
            ? 'Publishing...'
            : isSaving
                ? 'Saving...'
                : 'Saved';
    const isReadOnly = !isEditingDraft || isPublishing;
    const showPublished = Boolean(publishedVersion);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
        >
            <div className="min-h-screen bg-primary text-primary">
                {/* GLOBAL NAVBAR */}
                <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-default bg-secondary px-4 shadow-sm">
                    <div className="flex flex-1 items-center gap-4">
                        <Link to="/dashboard" className="p-2 text-secondary hover:text-primary transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <input
                            type="text"
                            value={title}
                            onChange={(event) => actions.setTitle(event.target.value)}
                            placeholder="Untitled form"
                            disabled={isReadOnly}
                            className="w-48 bg-transparent text-sm font-medium text-primary placeholder:text-muted focus:outline-none focus:border-b focus:border-primary-500 disabled:cursor-not-allowed"
                        />
                    </div>
                    
                    <div className="flex flex-1 justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('builder')}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'builder'
                                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'text-secondary hover:text-primary hover:bg-tertiary'
                                }`}
                        >
                            Questions
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('responses')}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'responses'
                                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'text-secondary hover:text-primary hover:bg-tertiary'
                                }`}
                        >
                            Responses
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('settings')}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'settings'
                                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'text-secondary hover:text-primary hover:bg-tertiary'
                                }`}
                        >
                            Settings
                        </button>
                    </div>

                    <div className="flex flex-1 items-center justify-end gap-3">
                        <span className="text-xs text-secondary hidden md:inline-block mr-2">
                            {statusLabel}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsShareOpen(true)}
                            className="rounded-lg border border-default bg-tertiary px-4 py-2 text-sm font-semibold text-secondary transition hover:text-primary"
                        >
                            Share
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPublishConfirmOpen(true)}
                            disabled={isReadOnly}
                            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${isReadOnly
                                ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                                : 'bg-primary-500 text-on-primary hover:bg-primary-600'
                                }`}
                        >
                            {isPublishing ? (
                                <span className="inline-flex items-center gap-2">
                                    <Spinner size="sm" />
                                    Publishing...
                                </span>
                            ) : (
                                'Send'
                            )}
                        </button>
                    </div>
                </header>

                <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-24 sm:px-6">
                    {activeTab === 'builder' ? (
                        <div className="relative">
                            <div className="flex flex-col min-w-0 gap-6">
                                {/* FORM HEADER CARD */}
                                <section className="relative overflow-hidden rounded-xl border border-default bg-secondary shadow-sm">
                                    <div className="absolute top-0 left-0 right-0 h-2 bg-primary-500"></div>
                                    <div className="flex flex-col gap-4 p-6 pt-8">
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(event) => actions.setTitle(event.target.value)}
                                            placeholder="Form Title"
                                            disabled={isReadOnly}
                                            className="w-full bg-transparent text-3xl font-normal text-primary placeholder:text-muted focus:outline-none focus:border-b focus:border-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                                        />
                                        {validationErrors.title && (
                                            <p className="text-xs text-danger">
                                                {validationErrors.title}
                                            </p>
                                        )}
                                        <textarea
                                            value={description}
                                            onChange={(event) => actions.setDescription(event.target.value)}
                                            placeholder="Form description"
                                            rows={2}
                                            disabled={isReadOnly}
                                            className="w-full resize-none bg-transparent text-sm text-secondary placeholder:text-muted focus:outline-none focus:border-b focus:border-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                                        />
                                    </div>
                                </section>

                                <section className="flex flex-col gap-6">
                                    {sections.map((section, index) => (
                                        <SectionCard
                                            key={section.id}
                                            section={section}
                                            sectionIndex={index}
                                            sectionError={
                                                validationErrors.sections[section.id]
                                            }
                                            questionErrors={validationErrors.questions}
                                            sections={sections}
                                            canDelete={sections.length > 1}
                                            isDragDisabled={isSaving || isReadOnly}
                                            isEditing={!isReadOnly}
                                            onUpdateSection={actions.updateSection}
                                            onDuplicateSection={actions.duplicateSection}
                                            onDeleteSection={actions.deleteSection}
                                            onAddQuestion={actions.addQuestion}
                                            onUpdateQuestion={actions.updateQuestion}
                                            onDeleteQuestion={actions.deleteQuestion}
                                            onMoveQuestion={actions.moveQuestion}
                                            isActive={currentSectionId === section.id}
                                            onActivate={() => setActiveSectionId(section.id)}
                                        />
                                    ))}
                                </section>

                                </div>

                                {currentSectionId && (
                                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:absolute md:bottom-0 md:left-auto md:-right-20 md:top-0 md:-translate-x-0">
                                        <div className="md:sticky md:top-[50vh] md:-translate-y-1/2">
                                            <AddQuestionBar 
                                                onAdd={(type) => actions.addQuestion(currentSectionId, type)} 
                                                onAddSection={actions.addSection}
                                                onAiGenerate={() => setIsAiGenerateOpen(true)}
                                                isDisabled={isReadOnly} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'responses' ? (
                            <ResponsesPanel formId={id} />
                        ) : (
                            <SettingsPanel 
                                settings={settings} 
                                onChange={actions.setSettings}
                                isReadOnly={isReadOnly}
                            />
                        )}
                    </div>
                </div>
            {isPublishConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
                    <div className="w-full max-w-md rounded-xl border border-default bg-secondary p-6 shadow-lg">
                        <h2 className="text-lg font-semibold text-primary">Publish form?</h2>
                        <p className="mt-2 text-sm text-secondary">
                            Publishing locks the current draft into a versioned snapshot. You
                            can edit a new draft afterward.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPublishConfirmOpen(false)}
                                className="rounded-lg border border-default bg-tertiary px-4 py-2 text-sm font-semibold text-secondary transition hover:text-primary"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPublishConfirmOpen(false);
                                    actions.publishForm();
                                }}
                                disabled={isPublishing}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isPublishing
                                    ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                                    : 'bg-primary-500 text-on-primary hover:bg-primary-600'
                                    }`}
                            >
                                {isPublishing ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Spinner size="sm" />
                                        Publishing...
                                    </span>
                                ) : (
                                    'Publish'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isShareOpen && (
                <ShareModal
                    formId={id}
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                />
            )}
            <AiGenerateModal
                isOpen={isAiGenerateOpen}
                onClose={() => setIsAiGenerateOpen(false)}
                onGenerate={handleAiGenerate}
                isGenerating={isAiGenerating}
            />
            <DragOverlay>
                {activeQuestion ? (
                    <QuestionCardPreview question={activeQuestion} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default FormBuilderPage;