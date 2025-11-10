import {
    AlertCircle,
    Bot,
    CheckCircle2,
    FileText,
    Image as ImageIcon,
    Loader,
    MessageSquare,
    Network,
    Package,
    Send,
    TrendingUp,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessageEntity, ProjectArtifactEntity, ProjectEntity } from '../../domain/entities/Project';
import { ClaudeApiAdapter } from '../../infrastructure/adapters/api/ClaudeApiAdapter';
import { PrismaProjectRepository } from '../../infrastructure/repositories/PrismaProjectRepository';

interface AIDrivenCapabilitiesProps {
  selectedProject: ProjectEntity | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type CapabilityType = 'modeler' | 'reviewer' | 'mapper' | 'chat' | 'pattern' | null;

const AIDrivenCapabilities: React.FC<AIDrivenCapabilitiesProps> = ({ selectedProject }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedCapability, setSelectedCapability] = useState<CapabilityType>(null);
  const [artifacts, setArtifacts] = useState<ProjectArtifactEntity[]>([]);
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<Set<string>>(new Set());
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [reviewingSDD, setReviewingSDD] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const repo = useRef(new PrismaProjectRepository());

  const capabilities = React.useMemo(() => [
    {
      id: 'modeler' as CapabilityType,
      title: 'AI Modeler',
      description: 'Generate architecture diagrams or data models',
      icon: <FileText size={18} />,
      color: 'from-blue-500 to-cyan-500',
      prompt: 'Generate a draft architecture diagram for a microservices-based system'
    },
    {
      id: 'reviewer' as CapabilityType,
      title: 'AI Reviewer',
      description: selectedProject 
        ? `Review SDD document for ${selectedProject.name}`
        : 'Review SDD document (select a project first)',
      icon: <CheckCircle2 size={18} />,
      color: 'from-green-500 to-emerald-500',
      prompt: selectedProject 
        ? `Review the complete SDD document for ${selectedProject.name}`
        : 'Review architecture for security risks and compliance issues'
    },
    {
      id: 'mapper' as CapabilityType,
      title: 'AI Mapper',
      description: 'Auto-link systems and data flows',
      icon: <Network size={18} />,
      color: 'from-purple-500 to-pink-500',
      prompt: selectedProject
        ? `Auto-link systems and data flows for ${selectedProject.name}`
        : 'Map all system integrations and data flows'
    },
    {
      id: 'chat' as CapabilityType,
      title: 'Chat Query',
      description: 'Ask questions about architecture',
      icon: <MessageSquare size={18} />,
      color: 'from-orange-500 to-red-500',
      prompt: 'Show all APIs that connect Finacle to Johari'
    },
    {
      id: 'pattern' as CapabilityType,
      title: 'Pattern Recommender',
      description: 'Suggest integration or cloud patterns',
      icon: <TrendingUp size={18} />,
      color: 'from-indigo-500 to-purple-500',
      prompt: 'Suggest best-fit integration patterns for real-time payment processing'
    }
  ], [selectedProject]);

  // Load artifacts when project changes
  useEffect(() => {
    const loadArtifacts = async () => {
      if (!selectedProject) {
        setArtifacts([]);
        setSelectedArtifactIds(new Set());
        return;
      }

      setLoadingArtifacts(true);
      try {
        const projectArtifacts = await repo.current.getArtifactsByProject(selectedProject.id);
        const filtered = projectArtifacts.filter(a => a.projectId === selectedProject.id);
        setArtifacts(filtered);
        // Auto-select all artifacts by default
        setSelectedArtifactIds(new Set(filtered.map(a => a.id)));
      } catch (error) {
        console.error('Error loading artifacts:', error);
        setArtifacts([]);
        setSelectedArtifactIds(new Set());
      } finally {
        setLoadingArtifacts(false);
      }
    };

    loadArtifacts();
  }, [selectedProject?.id]);

  // Load chat history when project changes or component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const projectId = selectedProject?.id || null;
        const savedMessages = await repo.current.getChatMessagesByProject(projectId);
        
        // Convert ChatMessageEntity to ChatMessage format
        const chatMessages: ChatMessage[] = savedMessages.map((msg: ChatMessageEntity) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        
        setChatHistory(chatMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setChatHistory([]);
      }
    };

    loadChatHistory();
  }, [selectedProject?.id]);

  // Auto-scroll to bottom when new messages arrive or streaming content updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  const getSelectedArtifacts = useCallback((): ProjectArtifactEntity[] => {
    return artifacts.filter(a => selectedArtifactIds.has(a.id));
  }, [artifacts, selectedArtifactIds]);

  const toggleArtifactSelection = (artifactId: string) => {
    setSelectedArtifactIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artifactId)) {
        newSet.delete(artifactId);
      } else {
        newSet.add(artifactId);
      }
      return newSet;
    });
  };

  const selectAllArtifacts = () => {
    setSelectedArtifactIds(new Set(artifacts.map(a => a.id)));
  };

  const deselectAllArtifacts = () => {
    setSelectedArtifactIds(new Set());
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    
    // Save user message to database
    try {
      await repo.current.addChatMessage({
        projectId: selectedProject?.id || null,
        role: 'user',
        content: inputMessage.trim(),
        timestamp: userMessage.timestamp,
        capabilityType: selectedCapability
      });
    } catch (error) {
      console.error('Error saving user message:', error);
    }
    
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setLoading(true);
    setIsTyping(true);
    setStreamingContent(''); // Reset streaming content

    try {
      const apiAdapter = new ClaudeApiAdapter();
      
      // Prepare conversation history
      const conversationHistory = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get selected artifacts
      const selectedArtifacts = getSelectedArtifacts();

      // Prepare project context
      const projectContext = selectedProject ? {
        name: selectedProject.name,
        description: selectedProject.description || ''
      } : undefined;

      // Prepare artifacts in the format expected by the API
      const artifactsForAPI = selectedArtifacts.map(a => ({
        id: a.id,
        fileName: a.fileName,
        fileType: a.fileType,
        fileContent: a.fileContent,
        artifactType: a.artifactType
      }));

      // Use streaming API with real-time updates and artifacts
      let accumulatedContent = '';
      const finalResponse = await apiAdapter.chatStream(
        currentInput,
        conversationHistory,
        projectContext,
        artifactsForAPI,
        (chunk: string) => {
          // Update streaming content in real-time
          accumulatedContent += chunk;
          setStreamingContent(accumulatedContent);
        }
      );
      
      // Once streaming is complete, add the full message to history
      const assistantResponse: ChatMessage = {
        role: 'assistant',
        content: finalResponse,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, assistantResponse]);
      
      // Save assistant message to database
      try {
        await repo.current.addChatMessage({
          projectId: selectedProject?.id || null,
          role: 'assistant',
          content: finalResponse,
          timestamp: assistantResponse.timestamp,
          capabilityType: selectedCapability
        });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
      
      setStreamingContent(''); // Clear streaming content
    } catch (error: any) {
      console.error('Error processing message:', error);
      
      let errorContent = 'I apologize, but I encountered an error processing your request.';
      
      if (error.message) {
        if (error.message.includes('API key')) {
          errorContent = '**Configuration Error**\n\nPlease configure your Claude API key:\n1. Create a `.env` file in the project root\n2. Add: `VITE_ANTHROPIC_API_KEY=your_api_key_here`\n3. Restart the development server';
        } else if (error.message.includes('Rate limit')) {
          errorContent = '**Rate Limit Exceeded**\n\nToo many requests. Please wait a moment and try again.';
        } else if (error.message.includes('Connection')) {
          errorContent = '**Connection Error**\n\nUnable to connect to Claude API. Please check your internet connection and try again.';
        } else {
          errorContent = `**Error**\n\n${error.message}\n\nPlease try again or rephrase your question.`;
        }
      }
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
      
      // Save error message to database
      try {
        await repo.current.addChatMessage({
          projectId: selectedProject?.id || null,
          role: 'assistant',
          content: errorContent,
          timestamp: errorMessage.timestamp,
          capabilityType: selectedCapability
        });
      } catch (error) {
        console.error('Error saving error message:', error);
      }
      
      setStreamingContent(''); // Clear streaming content on error
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleCapabilityClick = async (capability: typeof capabilities[0]) => {
    setSelectedCapability(capability.id);
    
    // Special handling for AI Reviewer - automatically review SDD if project is selected
    if (capability.id === 'reviewer' && selectedProject) {
      await handleSDDReview();
    } else {
      setInputMessage(capability.prompt);
      textareaRef.current?.focus();
    }
  };

  const handleSDDReview = async () => {
    if (!selectedProject || reviewingSDD) return;

    setReviewingSDD(true);
    setLoading(true);
    setIsTyping(true);
    setStreamingContent('');

    try {
      // Get all generated sections for the project
      const generatedSections = await repo.current.getGeneratedSectionsByProject(selectedProject.id);
      
      // Filter out subsections (only get top-level sections)
      const topLevelSections = generatedSections.filter(s => !s.parentSectionId);
      
      if (topLevelSections.length === 0) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: '**No SDD Sections Found**\n\nPlease generate some SDD sections first before requesting a review. Go to the SDD view and generate sections for your project.',
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, errorMessage]);
        setReviewingSDD(false);
        setLoading(false);
        setIsTyping(false);
        return;
      }

      // Prepare sections for review
      const sectionsForReview = topLevelSections.map(section => ({
        sectionId: section.sectionId,
        sectionTitle: section.sectionTitle,
        content: section.content || ''
      }));

      // Get selected artifacts (or all artifacts if none selected)
      const artifactsForReview = getSelectedArtifacts();
      if (artifactsForReview.length === 0 && artifacts.length > 0) {
        // Auto-select all artifacts if none selected
        artifactsForReview.push(...artifacts);
      }

      // Prepare project context
      const projectContext = {
        name: selectedProject.name,
        description: selectedProject.description || ''
      };

      // Prepare artifacts in the format expected by the API
      const artifactsForAPI = artifactsForReview.map(a => ({
        id: a.id,
        fileName: a.fileName,
        fileType: a.fileType,
        fileContent: a.fileContent,
        artifactType: a.artifactType
      }));

      // Add user message indicating review is starting
      const userMessage: ChatMessage = {
        role: 'user',
        content: `Review the SDD document for ${selectedProject.name} (${sectionsForReview.length} sections)`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, userMessage]);

      // Save user message to database
      try {
        await repo.current.addChatMessage({
          projectId: selectedProject.id,
          role: 'user',
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          capabilityType: 'reviewer'
        });
      } catch (error) {
        console.error('Error saving user message:', error);
      }

      // Call the review API
      const apiAdapter = new ClaudeApiAdapter();
      
      // Get the review response
      const reviewResponse = await apiAdapter.reviewSDDDocument(
        sectionsForReview,
        projectContext,
        artifactsForAPI
      );

      // Show the response in streaming area first
      setStreamingContent(reviewResponse);
      
      // Wait a moment to show the streaming content, then add to history
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add assistant response to history
      const assistantResponse: ChatMessage = {
        role: 'assistant',
        content: reviewResponse,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, assistantResponse]);
      
      // Save assistant message to database
      try {
        await repo.current.addChatMessage({
          projectId: selectedProject.id,
          role: 'assistant',
          content: reviewResponse,
          timestamp: assistantResponse.timestamp,
          capabilityType: 'reviewer'
        });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }

      setStreamingContent('');
    } catch (error: any) {
      console.error('Error reviewing SDD:', error);
      
      let errorContent = 'I apologize, but I encountered an error while reviewing the SDD document.';
      
      if (error.message) {
        if (error.message.includes('API key')) {
          errorContent = '**Configuration Error**\n\nPlease configure your Claude API key:\n1. Create a `.env` file in the project root\n2. Add: `VITE_ANTHROPIC_API_KEY=your_api_key_here`\n3. Restart the development server';
        } else if (error.message.includes('Rate limit')) {
          errorContent = '**Rate Limit Exceeded**\n\nToo many requests. Please wait a moment and try again.';
        } else if (error.message.includes('Connection')) {
          errorContent = '**Connection Error**\n\nUnable to connect to Claude API. Please check your internet connection and try again.';
        } else {
          errorContent = `**Error**\n\n${error.message}\n\nPlease try again.`;
        }
      }
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
      
      // Save error message to database
      try {
        await repo.current.addChatMessage({
          projectId: selectedProject?.id || null,
          role: 'assistant',
          content: errorContent,
          timestamp: errorMessage.timestamp,
          capabilityType: 'reviewer'
        });
      } catch (error) {
        console.error('Error saving error message:', error);
      }
      
      setStreamingContent('');
    } finally {
      setReviewingSDD(false);
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInputMessage(prompt);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    try {
      const projectId = selectedProject?.id || null;
      await repo.current.deleteChatMessagesByProject(projectId);
      setChatHistory([]);
      setSelectedCapability(null);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      // Still clear local state even if DB delete fails
      setChatHistory([]);
      setSelectedCapability(null);
    }
  };

  const businessArtifacts = artifacts.filter(a => 
    (a.artifactType === 'BRD' || a.artifactType === 'FLOW' || a.artifactType === 'SEQUENCE' || a.artifactType === 'OTHER')
  );
  const techArtifacts = artifacts.filter(a => 
    (a.artifactType === 'ARCHITECTURE' || a.artifactType === 'TECHNICAL_SPEC')
  );

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 glass-dark border border-white/10 rounded-lg flex flex-col overflow-hidden h-full">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-3 border-b border-white/10">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-1.5 rounded-lg">
              <Bot size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-white">AI Capabilities</h3>
          </div>
        </div>

        {/* Capabilities - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0" style={{ overscrollBehavior: 'contain' }}>
          {capabilities.map((capability) => (
            <button
              key={capability.id}
              onClick={() => handleCapabilityClick(capability)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                selectedCapability === capability.id
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50'
                  : 'hover:bg-white/5 text-purple-200/80 hover:text-purple-200 border border-transparent hover:border-purple-500/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`bg-gradient-to-br ${capability.color} p-1 rounded`}>
                  {capability.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{capability.title}</div>
                  <div className="text-xs opacity-70 truncate">{capability.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Artifacts Selection - Fixed at bottom */}
        {selectedProject && (
          <div className="flex-shrink-0 border-t border-white/10 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-white/10 flex items-center justify-between">
              <div className="text-xs font-semibold text-purple-200">Artifacts</div>
              {artifacts.length > 0 && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={selectAllArtifacts}
                    className="text-[10px] text-purple-300/70 hover:text-purple-200 px-1.5 py-0.5 rounded"
                    title="Select All"
                  >
                    All
                  </button>
                  <span className="text-purple-300/50">|</span>
                  <button
                    onClick={deselectAllArtifacts}
                    className="text-[10px] text-purple-300/70 hover:text-purple-200 px-1.5 py-0.5 rounded"
                    title="Deselect All"
                  >
                    None
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {loadingArtifacts ? (
                <div className="flex items-center space-x-2 text-xs text-purple-300/70">
                  <Loader size={12} className="animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : artifacts.length === 0 ? (
                <div className="text-xs text-purple-300/60 italic">No artifacts</div>
              ) : (
                <>
                  {businessArtifacts.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] font-semibold text-purple-300/80 mb-1 flex items-center space-x-1">
                        <Package size={10} />
                        <span>Business ({businessArtifacts.length})</span>
                      </div>
                      {businessArtifacts.map(artifact => (
                        <label
                          key={artifact.id}
                          className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedArtifactIds.has(artifact.id)}
                            onChange={() => toggleArtifactSelection(artifact.id)}
                            className="w-3 h-3 rounded border-purple-400/50 bg-purple-900/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <span className="text-[10px] text-purple-200/80 group-hover:text-purple-200 truncate flex-1" title={artifact.fileName}>
                            {artifact.fileName}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {techArtifacts.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-purple-300/80 mb-1 flex items-center space-x-1">
                        <ImageIcon size={10} />
                        <span>Technology ({techArtifacts.length})</span>
                      </div>
                      {techArtifacts.map(artifact => (
                        <label
                          key={artifact.id}
                          className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedArtifactIds.has(artifact.id)}
                            onChange={() => toggleArtifactSelection(artifact.id)}
                            className="w-3 h-3 rounded border-purple-400/50 bg-purple-900/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <span className="text-[10px] text-purple-200/80 group-hover:text-purple-200 truncate flex-1" title={artifact.fileName}>
                            {artifact.fileName}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {artifacts.length > 0 && (
              <div className="p-2 border-t border-white/10 text-[10px] text-purple-300/70">
                {selectedArtifactIds.size} of {artifacts.length} selected
              </div>
            )}
          </div>
        )}

        {!selectedProject && (
          <div className="flex-shrink-0 p-3 border-t border-white/10">
            <div className="flex items-center space-x-2 text-xs text-yellow-300/80">
              <AlertCircle size={12} />
              <span>Select a project to enable artifact context</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 glass-dark border border-white/10 rounded-lg overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-1.5 rounded-lg">
              <MessageSquare size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Chat</h3>
              {selectedProject && (
                <p className="text-xs text-purple-200/70">{selectedProject.name}</p>
              )}
            </div>
          </div>
            {chatHistory.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center space-x-1 glass hover:bg-white/10 text-purple-200 px-2 py-1 rounded text-xs transition-all border border-purple-500/30 hover:border-purple-400/50"
              >
                <X size={12} />
                <span>Clear</span>
              </button>
            )}
        </div>

        {/* Chat Messages - Scrollable Only (Independent from page) */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
          style={{ 
            overscrollBehavior: 'contain',
            isolation: 'isolate'
          }}
        >
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-4 rounded-full mb-4">
                <Bot size={32} className="text-purple-300" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">How can I help you?</h3>
              <p className="text-xs text-purple-200/70 mb-6 text-center max-w-sm">
                Select a capability from the sidebar or start typing your question.
              </p>

              {/* Quick Examples */}
              <div className="w-full max-w-md space-y-1.5">
                {capabilities.slice(0, 3).map((capability, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(capability.prompt)}
                    className="w-full glass border border-white/10 hover:border-purple-500/30 rounded-lg p-2 text-left transition-all hover:scale-[1.01] group text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`bg-gradient-to-br ${capability.color} p-1 rounded`}>
                        {capability.icon}
                      </div>
                      <span className="text-purple-200/80 group-hover:text-purple-200 line-clamp-1">
                        {capability.prompt}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                        : 'bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-400/50'
                    }`}>
                      {message.role === 'user' ? (
                        <span className="text-white text-[10px] font-semibold">U</span>
                      ) : (
                        <Bot size={12} className="text-purple-200" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white border border-purple-400/50'
                        : 'glass text-purple-200 border border-white/20'
                    }`}>
                      {message.role === 'assistant' ? (
                        <div className="text-xs break-words prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-1.5 last:mb-0 text-xs">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5 text-xs">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5 text-xs">{children}</ol>,
                              li: ({ children }) => <li className="ml-1 text-xs">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-purple-100 text-xs">{children}</strong>,
                              em: ({ children }) => <em className="italic text-xs">{children}</em>,
                              code: ({ children, className, ...props }) => {
                                const isInline = !className || !className.includes('language-');
                                return isInline ? (
                                  <code className="bg-purple-900/50 px-1 py-0.5 rounded text-[10px] font-mono" {...props}>{children}</code>
                                ) : (
                                  <code className="block bg-purple-900/50 p-2 rounded text-[10px] font-mono overflow-x-auto" {...props}>{children}</code>
                                );
                              },
                              pre: ({ children }) => <pre className="bg-purple-900/50 p-2 rounded text-[10px] font-mono overflow-x-auto mb-1.5">{children}</pre>,
                              h1: ({ children }) => <h1 className="text-sm font-bold mb-1.5 mt-2 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xs font-bold mb-1 mt-2 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-xs font-semibold mb-0.5 mt-1.5 first:mt-0">{children}</h3>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-purple-400 pl-2 italic my-1.5 text-xs">{children}</blockquote>,
                              a: ({ href, children }) => <a href={href} className="text-blue-300 hover:text-blue-200 underline text-xs" target="_blank" rel="noopener noreferrer">{children}</a>
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-xs whitespace-pre-wrap break-words">{message.content}</div>
                      )}
                      <div className={`text-[10px] mt-1 opacity-60 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming Response - Real-time typing */}
              {isTyping && streamingContent && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[85%]">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-400/50 flex items-center justify-center">
                      <Bot size={12} className="text-purple-200" />
                    </div>
                    <div className="glass border border-white/20 rounded-lg px-3 py-2">
                      <div className="text-xs break-words prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0 text-xs">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5 text-xs">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5 text-xs">{children}</ol>,
                            li: ({ children }) => <li className="ml-1 text-xs">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-purple-100 text-xs">{children}</strong>,
                            em: ({ children }) => <em className="italic text-xs">{children}</em>,
                            code: ({ children, className, ...props }) => {
                              const isInline = !className || !className.includes('language-');
                              return isInline ? (
                                <code className="bg-purple-900/50 px-1 py-0.5 rounded text-[10px] font-mono" {...props}>{children}</code>
                              ) : (
                                <code className="block bg-purple-900/50 p-2 rounded text-[10px] font-mono overflow-x-auto" {...props}>{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="bg-purple-900/50 p-2 rounded text-[10px] font-mono overflow-x-auto mb-1.5">{children}</pre>,
                            h1: ({ children }) => <h1 className="text-sm font-bold mb-1.5 mt-2 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xs font-bold mb-1 mt-2 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-semibold mb-0.5 mt-1.5 first:mt-0">{children}</h3>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-purple-400 pl-2 italic my-1.5 text-xs">{children}</blockquote>,
                            a: ({ href, children }) => <a href={href} className="text-blue-300 hover:text-blue-200 underline text-xs" target="_blank" rel="noopener noreferrer">{children}</a>
                          }}
                        >
                          {streamingContent}
                        </ReactMarkdown>
                      </div>
                      <span className="inline-block w-2 h-3 bg-purple-400 ml-1 animate-pulse">|</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Typing Indicator (when no content yet) */}
              {isTyping && !streamingContent && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[85%]">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-400/50 flex items-center justify-center">
                      <Bot size={12} className="text-purple-200" />
                    </div>
                    <div className="glass border border-white/20 rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="flex-shrink-0 p-3 border-t border-white/10 bg-glass-dark">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedProject 
                  ? `Ask about ${selectedProject.name}...`
                  : "Ask me anything about architecture..."
                }
                className="w-full px-3 py-2 glass border border-white/20 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-purple-300/50 transition-all resize-none outline-none text-xs max-h-[120px] overflow-y-auto"
                rows={1}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputMessage.trim() || reviewingSDD}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-purple-500/50 flex items-center justify-center flex-shrink-0"
            >
              {loading || reviewingSDD ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-purple-300/60">
            <span>Enter to send, Shift+Enter for new line</span>
            {selectedProject && artifacts.length > 0 && (
              <span className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedArtifactIds.size > 0 ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                <span>{selectedArtifactIds.size} of {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''} selected</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDrivenCapabilities;
