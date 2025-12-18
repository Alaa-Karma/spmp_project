// Global variables
let projectData = null;
let treeRoot, treeSvg, treeG, zoom, tooltip;
let currentTransform = d3.zoomIdentity;

// DOM Elements
const projectForm = document.getElementById('projectForm');
const projectDescriptionInput = document.getElementById('projectDescription');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const demoSection = document.getElementById('demoSection');
const objectivesList = document.getElementById('objectivesList');
const requirementsList = document.getElementById('requirementsList');
const riskTableBody = document.getElementById('riskTableBody');
const projectName = document.getElementById('projectName');
const projectMethodology = document.getElementById('projectMethodology');
const projectDuration = document.getElementById('projectDuration');
const projectPhasesCount = document.getElementById('projectPhasesCount');
const projectTeamSize = document.getElementById('projectTeamSize');
const nodeCountValue = document.getElementById('nodeCountValue');
const totalProjectTime = document.getElementById('totalProjectTime');
const pertTableBody = document.getElementById('pertTableBody');
const humanResourcesList = document.getElementById('humanResourcesList');
const teamSizeAlert = document.getElementById('teamSizeAlert');

// Gantt Chart Elements
const exportGanttBtn = document.getElementById('exportGanttBtn');
const exportWbsBtn = document.getElementById('exportWbsBtn');
const exportWordBtn = document.getElementById('exportWordBtn');

// Diagram elements
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetZoomBtn = document.getElementById('resetZoom');
const expandAllBtn = document.getElementById('expandAll');
const collapseAllBtn = document.getElementById('collapseAll');
const expandTextTreeBtn = document.getElementById('expandTextTree');
const collapseTextTreeBtn = document.getElementById('collapseTextTree');

// Event Listeners
projectForm.addEventListener('submit', handleSubmit);

// إضافة عناصر زر التصدير إذا لم تكن موجودة
// إضافة عناصر زر التصدير إذا لم تكن موجودة
function ensureExportButtons() {
    // تحقق من وجود أزرار التصدير وإضافتها إذا لزم الأمر
    const wbsSection = document.querySelector('.bg-white.rounded-2xl.shadow-xl.mb-8');
    if (wbsSection && !document.getElementById('exportWbsBtn')) {
        const headerDiv = wbsSection.querySelector('.p-6.border-b');
        if (headerDiv) {
            // إضافة زر WBS في أعلى القسم بجانب العنوان
            const titleDiv = headerDiv.querySelector('.flex.flex-col.sm\\:flex-row.sm\\:items-center.sm\\:justify-between');
            if (titleDiv) {
                // إنشاء زر التصدير
                const exportDiv = document.createElement('div');
                exportDiv.className = 'mt-3 sm:mt-0 flex flex-wrap gap-3';
                exportDiv.innerHTML = `
                    <button id="exportWbsBtn" class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm flex items-center gap-2 shadow-md">
                        <i class="fas fa-download ml-2"></i>
                        <span>تصدير مخطط WBS</span>
                    </button>
                `;
                // إضافة الزر بجانب العنوان مباشرة
                titleDiv.appendChild(exportDiv);
                
                // إضافة مستمع الحدث
                document.getElementById('exportWbsBtn').addEventListener('click', exportWbsAsImage);
            }
        }
    }
}

if (exportGanttBtn) {
    exportGanttBtn.addEventListener('click', exportGanttAsImage);
}

// إلغاء مستمع PDF
// if (exportPdfBtn) {
//     exportPdfBtn.removeEventListener('click', exportToPdf);
//     exportPdfBtn.style.display = 'none';
// }

const copyJsonBtn = document.getElementById('copyJsonBtn');
if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', copyResultsAsJson);
}

// Initialize with example project
projectDescriptionInput.value = 'تطبيق ويب لإدارة المهام والمشاريع للفرق البرمجية مع نظام متابعة وإشعارات وتقارير أداء';

// التحقق من عدد الكلمات (15 كلمة على الأقل)
function validateWordCount(text) {
    // إزالة المسافات الزائدة وتقسيم النص إلى كلمات
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length >= 15;
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    const description = projectDescriptionInput.value.trim();
    
    if (!description) {
        showError('الرجاء إدخال وصف المشروع');
        return;
    }
    
    // التحقق من عدد الكلمات
    if (!validateWordCount(description)) {
        showError('يجب أن يحتوي وصف المشروع على 15 كلمة على الأقل. الرجاء تقديم وصف أكثر تفصيلاً.');
        return;
    }
    
    showLoading();
    hideError();
    hideResults();
    
    try {
        const response = await fetch('http://localhost:5000/generate-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description: description }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'فشل في توليد خطة المشروع');
        }
        
        // تحقق مما إذا كان هناك خطأ في البيانات
        if (data.success === false) {
            showError(data.error || 'حدث خطأ أثناء معالجة الطلب');
            return;
        }
        
        if (data.success) {
            projectData = data.data;
            displayResults();
            demoSection.classList.add('hidden');
        } else {
            throw new Error(data.error || 'حدث خطأ أثناء معالجة الطلب');
        }
    } catch (err) {
        showError(err.message || 'حدث خطأ غير متوقع');
        console.error('Error:', err);
    } finally {
        hideLoading();
    }
}

// إخفاء قسم النتائج
function hideResults() {
    resultsSection.classList.add('hidden');
    demoSection.classList.remove('hidden');
}

// Show loading indicator
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التوليد...';
}

// Hide loading indicator
function hideLoading() {
    loadingIndicator.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    submitBtn.innerHTML = '<i class="fas fa-magic"></i><span>توليد الخطة الشاملة</span>';
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    
    setTimeout(() => {
        errorMessage.classList.add('error-shake');
        setTimeout(() => {
            errorMessage.classList.remove('error-shake');
        }, 500);
    }, 10);
}

// Hide error message
function hideError() {
    errorMessage.classList.add('hidden');
}
// Copy results as JSON - دالة النسخ كـ JSON
// Copy results as JSON - دالة النسخ كـ JSON
function copyResultsAsJson() {
    if (!projectData) {
        showNotification('❌ لا توجد بيانات للنسخ', 'error');
        return;
    }
    
    try {
        // Prepare comprehensive data for JSON export
        const exportData = {
            project_info: projectData.project_info || {},
            scope: projectData.scope || {},
            wbs: projectData.wbs || [],
            timeline: projectData.timeline || {},
            risk_management: projectData.risk_management || [],
            resource_plan: projectData.resource_plan || {},
            export_info: {
                exported_by: "Smart Project Planner",
                export_format: "JSON",
                export_date: new Date().toLocaleDateString('ar-SA'),
                version: "2.0.0"
            }
        };
        
        // Convert to formatted JSON string
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // استخدام Clipboard API للنسخ إلى الحافظة
        navigator.clipboard.writeText(jsonString)
            .then(() => {
                showNotification('✅ تم نسخ بيانات المشروع كـ JSON إلى الحافظة', 'success');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback إلى طريقة قديمة
                const textArea = document.createElement('textarea');
                textArea.value = jsonString;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('✅ تم نسخ بيانات المشروع إلى الحافظة', 'success');
            });
            
    } catch (error) {
        console.error('Error copying results:', error);
        showNotification('❌ حدث خطأ أثناء نسخ البيانات', 'error');
    }
}

// Display comprehensive results
function displayResults() {
    // Show results section
    resultsSection.classList.remove('hidden');
    demoSection.classList.add('hidden');
    
    // Update project header
    projectName.textContent = projectData.project_info?.name || 'مشروع جديد';
    projectMethodology.textContent = projectData.project_info?.methodology || 'غير محدد';
    
    // Calculate project duration and phases
    let totalDuration = 0;
    let phasesCount = 0;
    let totalTasks = 0;
    let teamSize = projectData.project_info?.team_size || 0;
    
    if (projectData.wbs && projectData.wbs.length > 0) {
        phasesCount = projectData.wbs.length;
        projectData.wbs.forEach(phase => {
            if (phase.time_estimation && phase.time_estimation.expected) {
                totalDuration += parseFloat(phase.time_estimation.expected);
            }
            if (phase.tasks) totalTasks += phase.tasks.length;
            if (phase.resources) teamSize = Math.max(teamSize, phase.resources.length);
        });
    }
    
    projectPhasesCount.textContent = phasesCount;
    projectDuration.textContent = totalDuration > 0 ? `${Math.ceil(totalDuration/7)} أسابيع` : 'مدة غير محددة';
    projectTeamSize.textContent = teamSize > 0 ? teamSize : 'غير محدد';
    
    // Check if team size was specified
    if (teamSize === 0) {
        teamSizeAlert.classList.remove('hidden');
        teamSizeAlert.classList.add('warning-note');
    } else {
        teamSizeAlert.classList.add('hidden');
    }
    
    // Populate objectives (NO SCROLL)
    objectivesList.innerHTML = '';
    if (projectData.scope?.objectives && projectData.scope.objectives.length > 0) {
        projectData.scope.objectives.forEach((objective, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-start p-4 bg-gradient-to-r from-primary-50 to-white rounded-lg hover:shadow-md transition-all duration-300 objective-card';
            li.innerHTML = `
                <div class="flex items-start w-full">
                    <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center ml-3 flex-shrink-0">
                        <span class="text-primary-600 font-bold">${index + 1}</span>
                    </div>
                    <div class="flex-1 pr-3">
                        <div class="flex items-center">
                            <i class="fas fa-check-circle text-green-500 ml-2"></i>
                            <span class="text-gray-700 font-medium text-lg">${objective}</span>
                        </div>
                    </div>
                </div>
            `;
            objectivesList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.className = 'text-gray-500 text-center py-6';
        li.innerHTML = `
            <i class="fas fa-info-circle text-primary-400 text-2xl mb-2"></i>
            <p>لا توجد أهداف متاحة لهذا المشروع</p>
        `;
        objectivesList.appendChild(li);
    }
    
    // Populate requirements (NO SCROLL)
    requirementsList.innerHTML = '';
    const requirements = projectData.scope?.requirements || [];
    if (requirements.length > 0) {
        requirements.forEach((requirement, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-start p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg hover:shadow-md transition-all duration-300 requirement-card';
            li.innerHTML = `
                <div class="flex items-start w-full">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center ml-3 flex-shrink-0">
                        <span class="text-blue-600 font-bold">${index + 1}</span>
                    </div>
                    <div class="flex-1 pr-3">
                        <div class="flex items-center">
                            <i class="fas fa-list-check text-blue-500 ml-2"></i>
                            <span class="text-gray-700 text-lg">${requirement}</span>
                        </div>
                    </div>
                </div>
            `;
            requirementsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.className = 'text-gray-500 text-center py-6';
        li.innerHTML = `
            <i class="fas fa-info-circle text-blue-400 text-2xl mb-2"></i>
            <p>لا توجد متطلبات وظيفية متاحة لهذا المشروع</p>
        `;
        requirementsList.appendChild(li);
    }
    
    // Generate PERT estimations
    generatePertEstimations();
    
    // Display human resources
    displayHumanResources();
    
    // Populate risk management table
    populateRiskTable();
    
    // Convert project data to tree structure
    const treeData = convertToTreeData(projectData);
    
    // Initialize diagram with Arabic support
    initDiagram(treeData);
    
    // Populate text tree
    renderTextTree(treeData);
    
    // Initialize Gantt chart
    initGanttChart();
    
    // Initialize controls
    initControls();
    
    // تأكد من وجود أزرار التصدير
    setTimeout(ensureExportButtons, 100);
}

// Generate PERT estimations based on tasks
function generatePertEstimations() {
    if (!projectData.wbs || projectData.wbs.length === 0) {
        totalProjectTime.textContent = '0 يوم';
        pertTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-2 block"></i>
                    <p>لا توجد بيانات لتقدير الوقت</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const pertEstimations = [];
    let totalPertDays = 0;
    
    projectData.wbs.forEach((phase, phaseIndex) => {
        if (phase.time_estimation) {
            const estimation = phase.time_estimation;
            const phaseEstimation = {
                name: phase.phase || `المرحلة ${phaseIndex + 1}`,
                type: 'phase',
                optimistic: estimation.optimistic || 0,
                likely: estimation.likely || 0,
                pessimistic: estimation.pessimistic || 0,
                pert: estimation.expected || 0,
                standardDeviation: (estimation.pessimistic - estimation.optimistic) / 6 || 0
            };
            pertEstimations.push(phaseEstimation);
            totalPertDays += phaseEstimation.pert;
        }
    });
    
    // Update total project time
    totalProjectTime.textContent = `${Math.round(totalPertDays)} يوم تقريباً (${Math.round(totalPertDays/7)} أسبوع)`;
    
    // Populate PERT table
    pertTableBody.innerHTML = '';
    pertEstimations.forEach((estimation, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
        
        row.innerHTML = `
            <td class="px-3 py-2 whitespace-nowrap">
                <span class="font-medium">${estimation.name}</span>
                <span class="text-xs text-gray-500 block">${estimation.type === 'phase' ? 'مرحلة' : 'مهمة'}</span>
            </td>
            <td class="px-3 py-2 text-center pert-optimistic">${estimation.optimistic}</td>
            <td class="px-3 py-2 text-center pert-likely">${estimation.likely}</td>
            <td class="px-3 py-2 text-center pert-pessimistic">${estimation.pessimistic}</td>
            <td class="px-3 py-2 text-center pert-calculated">${estimation.pert.toFixed(1)}</td>
            <td class="px-3 py-2 text-center pert-standard-dev">${estimation.standardDeviation.toFixed(2)}</td>
        `;
        
        pertTableBody.appendChild(row);
    });
}

// Display human resources
function displayHumanResources() {
    humanResourcesList.innerHTML = '';
    
    // Extract resources from project data
    const resourcePlan = projectData.resource_plan;
    
    if (resourcePlan && resourcePlan.roles_needed && resourcePlan.roles_needed.length > 0) {
        resourcePlan.roles_needed.forEach((role, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 resource-item';
            li.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-user ml-3 text-yellow-600"></i>
                    <span class="resource-role">${role}</span>
                </div>
                <div class="resource-count">${index === 0 ? 1 : 1}</div>
            `;
            humanResourcesList.appendChild(li);
        });
    } else {
        // If no resources specified, use default roles
        const defaultRoles = [
            'مدير المشروع',
            'مطور Frontend',
            'مطور Backend',
            'مصمم واجهات',
            'مهندس جودة',
            'محلل نظم'
        ];
        
        defaultRoles.forEach((role, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 resource-item';
            li.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-user ml-3 text-yellow-600"></i>
                    <span class="resource-role">${role}</span>
                </div>
                <div class="resource-count">${index === 0 ? 1 : 1}</div>
            `;
            humanResourcesList.appendChild(li);
        });
    }
}

// Populate risk management table
function populateRiskTable() {
    riskTableBody.innerHTML = '';
    if (projectData.risk_management && projectData.risk_management.length > 0) {
        projectData.risk_management.forEach((risk, index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
            
            // Determine priority color
            let priorityColor = 'gray';
            let priorityText = 'غير محدد';
            if (risk.priority) {
                if (risk.priority.includes('عالي')) {
                    priorityColor = 'red';
                    priorityText = 'عالي';
                } else if (risk.priority.includes('متوسط')) {
                    priorityColor = 'yellow';
                    priorityText = 'متوسط';
                } else if (risk.priority.includes('منخفض')) {
                    priorityColor = 'green';
                    priorityText = 'منخفض';
                }
            }
            
            // Determine state (default to مفتوح)
            let stateColor = 'red';
            let stateText = 'مفتوح';
            
            row.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${priorityColor}-100 text-${priorityColor}-800">
                        R${index + 1}
                    </span>
                </td>
                <td class="px-4 py-3">${risk.risk || 'لا يوجد وصف'}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${priorityColor}-100 text-${priorityColor}-800">
                        ${priorityText}
                    </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="text-gray-700 font-medium">أسبوعي</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${stateColor}-100 text-${stateColor}-800">
                        ${stateText}
                    </span>
                </td>
                <td class="px-4 py-3">${risk.mitigation || 'لا توجد خطة تخفيف'}</td>
            `;
            riskTableBody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-info-circle text-2xl mb-2 block"></i>
                <p>لا توجد بيانات للمخاطر لهذا المشروع</p>
            </td>
        `;
        riskTableBody.appendChild(row);
    }
}

// Convert project data to tree structure for D3 diagram
function convertToTreeData(projectData) {
    const projectName = projectData.project_info?.name || "مشروع جديد";
    
    const tree = {
        name: projectName,
        type: "project",
        description: "المشروع الرئيسي",
        children: []
    };
    
    if (projectData.wbs && projectData.wbs.length > 0) {
        projectData.wbs.forEach((phase, index) => {
            const phaseNode = {
                name: phase.phase,
                type: "phase",
                description: `المدة: ${phase.time_estimation?.expected || 0} يوم`,
                children: []
            };
            
            if (phase.tasks && phase.tasks.length > 0) {
                phase.tasks.forEach(task => {
                    phaseNode.children.push({
                        name: task,
                        type: "task",
                        description: "مهمة في المرحلة"
                    });
                });
            }
            
            // Add deliverables if available
            if (phase.deliverables && phase.deliverables.length > 0) {
                phase.deliverables.forEach(deliverable => {
                    phaseNode.children.push({
                        name: deliverable,
                        type: "deliverable",
                        description: "مخرج من المرحلة"
                    });
                });
            }
            
            tree.children.push(phaseNode);
        });
    }
    
    return tree;
}

// Initialize D3 diagram with improved spacing and Arabic support
function initDiagram(treeData) {
    const container = document.querySelector('.diagram-container');
    const loadingIndicator = document.getElementById('diagramLoading');
    tooltip = d3.select('#diagramTooltip');
    
    // Hide loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // Clear previous diagram
    d3.select('#wbs-tree-diagram').selectAll('*').remove();
    
    // Create SVG with larger dimensions for better spacing
    treeSvg = d3.select('#wbs-tree-diagram')
        .attr('width', '100%')
        .attr('height', '100%');
    
    // Create main group with more space
    treeG = treeSvg.append('g')
        .attr('transform', 'translate(100, 80)'); // Increased initial translation
    
    // Create tree layout with increased spacing and RTL support
    const treeLayout = d3.tree()
        .size([container.clientHeight - 160, container.clientWidth - 200]) // Increased space
        .separation((a, b) => (a.parent == b.parent ? 2 : 3) / a.depth); // Increased separation
    
    // Create hierarchy
    treeRoot = d3.hierarchy(treeData);
    treeLayout(treeRoot);
    
    // Add zoom functionality
    zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
            currentTransform = event.transform;
            treeG.attr('transform', currentTransform);
        });
    
    treeSvg.call(zoom);
    
    // Initial render
    updateDiagram();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (!container) return;
        
        treeLayout.size([container.clientHeight - 160, container.clientWidth - 200]);
        
        if (treeRoot) {
            treeLayout(treeRoot);
            updateDiagram();
        }
    });
}

// Update diagram with improved node spacing and Arabic text
function updateDiagram() {
    const container = document.querySelector('.diagram-container');
    if (!container || !treeRoot) return;
    
    const treeLayout = d3.tree()
        .size([container.clientHeight - 160, container.clientWidth - 200])
        .separation((a, b) => (a.parent == b.parent ? 2 : 3) / a.depth);
    
    treeLayout(treeRoot);
    
    const treeData = treeLayout(treeRoot);
    
    // Update links
    const link = treeG.selectAll('.link')
        .data(treeData.links(), d => `${d.source.data.name}-${d.target.data.name}`);
    
    link.enter().append('path')
        .attr('class', 'link')
        .merge(link)
        .transition()
        .duration(300)
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));
    
    link.exit().remove();
    
    // Update nodes with Arabic text support
    const node = treeG.selectAll('.node')
        .data(treeData.descendants(), d => d.data.name);
    
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .on('click', function(event, d) {
            toggleDiagramNode(d);
            event.stopPropagation();
        })
        .on('mouseover', function(event, d) {
            showDiagramTooltip(event, d);
            d3.select(this).select('circle')
                .transition()
                .duration(200)
                .attr('r', 14); // Larger on hover
        })
        .on('mousemove', function(event) {
            if (tooltip) {
                tooltip.style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 15) + 'px');
            }
        })
        .on('mouseout', function(event, d) {
            hideDiagramTooltip();
            d3.select(this).select('circle')
                .transition()
                .duration(200)
                .attr('r', 10); // Back to normal size
        });
    
    // Add circles - larger size
    nodeEnter.append('circle')
        .attr('r', 10)
        .attr('fill', d => getNodeColor(d.data.type))
        .attr('stroke', '#fff')
        .attr('stroke-width', 3);
    
    // Add Arabic text with RTL support
    nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? 20 : -20) // Increased spacing for Arabic text
        .attr('text-anchor', d => d.children || d._children ? 'start' : 'end')
        .attr('direction', 'rtl')
        .attr('unicode-bidi', 'bidi-override')
        .style('font-family', '"IBM Plex Sans Arabic", sans-serif')
        .style('font-size', d => d.depth === 0 ? '18px' : '14px') // Larger fonts for Arabic
        .style('font-weight', d => d.depth === 0 ? 'bold' : 'normal')
        .style('fill', d => d.depth === 0 ? '#1a3a6c' : '#2c3e50')
        .style('text-shadow', '0 1px 2px rgba(255,255,255,0.9)')
        .text(d => d.data.name);
    
    // Update existing nodes
    node.merge(nodeEnter)
        .transition()
        .duration(300)
        .attr('transform', d => `translate(${d.y},${d.x})`);
    
    node.exit()
        .transition()
        .duration(300)
        .style('opacity', 0)
        .remove();
}

// Toggle diagram node
function toggleDiagramNode(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    updateDiagram();
}

// Show diagram tooltip
function showDiagramTooltip(event, d) {
    if (!tooltip) return;
    
    tooltip.html(`
        <strong>${d.data.name}</strong>
        <div style="margin: 5px 0; font-size: 12px; color: #3498db">${getNodeTypeArabic(d.data.type)}</div>
        <div style="font-size: 12px;">${d.data.description || 'لا يوجد وصف'}</div>
        <div style="margin-top: 5px; font-size: 11px; color: #95a5a6">
            العمق: ${d.depth} | الأبناء: ${(d.children || d._children || []).length}
        </div>
    `)
    .style('opacity', 1);
}

// Hide diagram tooltip
function hideDiagramTooltip() {
    if (tooltip) {
        tooltip.style('opacity', 0);
    }
}

// Get node color by type
function getNodeColor(type) {
    switch(type) {
        case 'project': return '#f39c12';
        case 'phase': return '#3498db';
        case 'deliverable': return '#9b59b6';
        case 'milestone': return '#e74c3c';
        case 'task': return '#2ecc71';
        default: return '#95a5a6';
    }
}

// Get node type in Arabic
function getNodeTypeArabic(type) {
    switch(type) {
        case 'project': return 'المشروع';
        case 'phase': return 'المرحلة';
        case 'deliverable': return 'المُخرَج';
        case 'milestone': return 'المعلم الرئيسي';
        case 'task': return 'المهمة';
        default: return 'العنصر';
    }
}

// Get node icon by type
function getNodeIcon(type) {
    switch(type) {
        case 'project': return 'fas fa-folder';
        case 'phase': return 'fas fa-folder-open';
        case 'deliverable': return 'far fa-file-alt';
        case 'milestone': return 'fas fa-flag-checkered';
        case 'task': return 'fas fa-tasks';
        default: return 'fas fa-circle';
    }
}

// Render text tree
function renderTextTree(treeData) {
    const wbsTextTree = document.getElementById('wbsTextTree');
    if (!wbsTextTree) return;
    
    wbsTextTree.innerHTML = '';
    
    const rootLi = createTextTreeNode(treeData);
    wbsTextTree.appendChild(rootLi);
    
    // Initialize text tree functionality
    initTextTree();
    
    // Update node count
    updateNodeCount();
}

// Create text tree node recursively
function createTextTreeNode(nodeData, depth = 0) {
    const li = document.createElement('li');
    
    if (nodeData.children && nodeData.children.length > 0) {
        // Node with children
        const caretSpan = document.createElement('span');
        caretSpan.className = 'caret arabic-caret';
        
        const icon = document.createElement('i');
        icon.className = getNodeIcon(nodeData.type);
        caretSpan.appendChild(icon);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = nodeData.name;
        caretSpan.appendChild(textSpan);
        
        if (nodeData.description) {
            const descSpan = document.createElement('span');
            descSpan.className = 'text-xs text-gray-500 mr-2';
            descSpan.textContent = `(${nodeData.description})`;
            caretSpan.appendChild(descSpan);
        }
        
        li.appendChild(caretSpan);
        
        const nestedUl = document.createElement('ul');
        nestedUl.className = 'nested active arabic-nested';
        
        nodeData.children.forEach(child => {
            nestedUl.appendChild(createTextTreeNode(child, depth + 1));
        });
        
        li.appendChild(nestedUl);
    } else {
        // Leaf node
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex items-center pr-4 py-2 hover:bg-gray-50 rounded transition-all arabic-leaf';
        contentDiv.style.paddingRight = `${20 + depth * 25}px`;
        
        const icon = document.createElement('i');
        icon.className = getNodeIcon(nodeData.type);
        icon.style.marginLeft = '10px';
        icon.style.color = getNodeColor(nodeData.type);
        icon.style.fontSize = '14px';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = nodeData.name;
        textSpan.style.fontSize = '14px';
        textSpan.style.fontFamily = '"IBM Plex Sans Arabic", sans-serif';
        
        contentDiv.appendChild(icon);
        contentDiv.appendChild(textSpan);
        li.appendChild(contentDiv);
    }
    
    return li;
}

// Initialize text tree functionality
function initTextTree() {
    const togglers = document.querySelectorAll("#wbsTextTree .caret");
    
    togglers.forEach(item => {
        item.addEventListener("click", function() {
            this.parentElement.querySelector(".nested").classList.toggle("active");
            this.classList.toggle("caret-down");
            
            // Update folder icon
            const icon = this.querySelector("i");
            if (icon && icon.classList.contains("fa-folder")) {
                icon.classList.replace("fa-folder", "fa-folder-open");
            } else if (icon && icon.classList.contains("fa-folder-open")) {
                icon.classList.replace("fa-folder-open", "fa-folder");
            }
        });
    });
}

// Update node count
function updateNodeCount() {
    let totalTasks = 0;
    if (projectData && projectData.wbs) {
        projectData.wbs.forEach(phase => {
            totalTasks += (phase.tasks ? phase.tasks.length : 0);
            totalTasks += (phase.deliverables ? phase.deliverables.length : 0);
        });
    }
    if (nodeCountValue) {
        nodeCountValue.textContent = totalTasks;
    }
}

// Estimate phase duration from description or default
function estimatePhaseDuration(phase) {
    if (phase.time_estimation && phase.time_estimation.expected) {
        return parseFloat(phase.time_estimation.expected);
    }
    
    // Default estimation based on phase name
    const name = phase.phase || '';
    if (name.includes('Sprint') || name.includes('سبرنت')) return 14; // 2 weeks
    if (name.includes('التحليل') || name.includes('تحليل')) return 10;
    if (name.includes('التطوير') || name.includes('تطوير')) return 20;
    if (name.includes('الاختبار') || name.includes('اختبار')) return 10;
    if (name.includes('النشر') || name.includes('نشر')) return 5;
    
    return 15; // Default 3 weeks
}

// Estimate task duration
function estimateTaskDuration(task) {
    // Simple estimation based on task complexity
    if (task.includes('تصميم') || task.includes('تخطيط')) return 3;
    if (task.includes('تطوير') || task.includes('برمجة')) return 5;
    if (task.includes('اختبار') || task.includes('فحص')) return 2;
    if (task.includes('توثيق') || task.includes('تدريب')) return 2;
    if (task.includes('نشر') || task.includes('تركيب')) return 3;
    
    return 3; // Default 3 days
}

// Generate Gantt chart data from project phases
function generateGanttData() {
    const ganttTasks = [];
    
    if (!projectData.wbs || projectData.wbs.length === 0) {
        return ganttTasks;
    }
    
    let taskId = 1;
    const startDate = new Date(); // تاريخ البدء هو اليوم
    let currentDate = new Date(startDate);
    
    projectData.wbs.forEach((phase, phaseIndex) => {
        // إضافة المرحلة كمهمة رئيسية
        const phaseDuration = estimatePhaseDuration(phase);
        const phaseEndDate = new Date(currentDate);
        phaseEndDate.setDate(phaseEndDate.getDate() + phaseDuration);
        
        ganttTasks.push({
            id: taskId++,
            task_name: `المرحلة ${phaseIndex + 1}: ${phase.phase || `مرحلة ${phaseIndex + 1}`}`,
            start_date: formatDate(currentDate),
            end_date: formatDate(phaseEndDate),
            status: getRandomStatus(0, 2), // حالة عشوائية بين لم يبدأ وقيد التنفيذ
            phase: true,
            duration: phaseDuration,
            resources: phase.resources || ['فريق المشروع'],
            description: phase.deliverables ? phase.deliverables.join(', ') : 'مرحلة المشروع'
        });
        
        // إضافة المهام داخل المرحلة
        if (phase.tasks && phase.tasks.length > 0) {
            let taskStartDate = new Date(currentDate);
            phase.tasks.forEach((task, taskIndex) => {
                const taskDuration = Math.max(3, Math.floor(estimateTaskDuration(task)));
                const taskEndDate = new Date(taskStartDate);
                taskEndDate.setDate(taskEndDate.getDate() + taskDuration);
                
                ganttTasks.push({
                    id: taskId++,
                    task_name: task,
                    start_date: formatDate(taskStartDate),
                    end_date: formatDate(taskEndDate),
                    status: getRandomStatus(0, 4), // حالة عشوائية بين 0 و 4
                    phase: false,
                    parentId: ganttTasks[ganttTasks.length - phase.tasks.length - 1]?.id || 0,
                    duration: taskDuration,
                    description: 'مهمة في المرحلة'
                });
                
                // المهام تبدأ بعد 2-3 أيام من بعضها
                taskStartDate.setDate(taskStartDate.getDate() + taskDuration + Math.floor(Math.random() * 3) + 1);
            });
        }
        
        // الانتقال للمرحلة التالية مع إضافة 5 أيام كفاصل
        currentDate.setDate(phaseEndDate.getDate() + 5);
    });
    
    return ganttTasks;
}

// Initialize simple Gantt chart
function initGanttChart() {
    const ganttContainer = document.getElementById('gantt-scroll-container');
    
    if (!ganttContainer) {
        console.error('Gantt container not found');
        return;
    }
    
    ganttContainer.innerHTML = '';
    
    const ganttTasks = generateGanttData();
    
    if (ganttTasks.length === 0) {
        ganttContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #666; font-size: 16px;"><i class="fas fa-chart-gantt text-3xl mb-3"></i><p>لا توجد بيانات لعرض مخطط جانت</p></div>';
        return;
    }
    
    // حساب نطاق التاريخ
    const startDate = new Date(Math.min(...ganttTasks.map(task => new Date(task.start_date))));
    const endDate = new Date(Math.max(...ganttTasks.map(task => new Date(task.end_date))));
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // إنشاء الجدول
    const table = document.createElement('table');
    table.className = 'gantt-simple-table';
    table.style.direction = 'rtl';
    
    // إنشاء الرأس (التواريخ)
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // الخلية الأولى في الرأس (عنوان المهام)
    const taskHeader = document.createElement('th');
    taskHeader.textContent = 'المهام';
    taskHeader.rowSpan = 2;
    headerRow.appendChild(taskHeader);
    
    // إضافة تواريخ الأيام
    const today = new Date();
    let currentDate = new Date(startDate);
    
    for (let i = 1; i <= totalDays; i++) {
        const dateHeader = document.createElement('th');
        dateHeader.className = 'date-header';
        
        // تحقق إذا كان اليوم الحالي
        if (currentDate.toDateString() === today.toDateString()) {
            dateHeader.classList.add('current-day');
        }
        
        // تحقق إذا كان نهاية الأسبوع
        if (currentDate.getDay() === 5 || currentDate.getDay() === 6) {
            dateHeader.classList.add('weekend-day');
        }
        
        dateHeader.textContent = currentDate.getDate();
        dateHeader.title = `${formatDate(currentDate)} - ${getDayName(currentDate.getDay())}`;
        headerRow.appendChild(dateHeader);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // إنشاء الجسم (المهام)
    const tbody = document.createElement('tbody');
    
    // إضافة صف لكل مهمة
    ganttTasks.forEach((task, taskIndex) => {
        const taskRow = document.createElement('tr');
        
        // الخلية الأولى: اسم المهمة
        const taskNameCell = document.createElement('td');
        const taskIcon = task.phase ? '📁 ' : '📝 ';
        taskNameCell.textContent = `${taskIcon}${task.task_name}`;
        taskNameCell.title = `${task.task_name}\nالمدة: ${task.duration} يوم\nمن ${task.start_date} إلى ${task.end_date}`;
        taskNameCell.style.fontFamily = '"IBM Plex Sans Arabic", sans-serif';
        taskRow.appendChild(taskNameCell);
        
        // خلايا الأيام لهذه المهمة
        currentDate = new Date(startDate);
        const taskStartDate = new Date(task.start_date);
        const taskEndDate = new Date(task.end_date);
        
        for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
            const dayCell = document.createElement('td');
            dayCell.className = 'date-cell';
            
            // تحقق إذا كان اليوم ضمن فترة المهمة
            if (currentDate >= taskStartDate && currentDate <= taskEndDate) {
                // حساب إذا كان هذا أول يوم في المهمة
                const isFirstDay = currentDate.getTime() === taskStartDate.getTime();
                
                if (isFirstDay) {
                    // حساب طول المهمة بالأيام
                    const taskDuration = Math.ceil((taskEndDate - taskStartDate) / (1000 * 60 * 60 * 24)) + 1;
                    
                    // إنشاء شريط المهمة
                    const taskBar = document.createElement('div');
                    taskBar.className = `task-bar-simple status-${task.status}`;
                    
                    // عرض الشريط لعدة خلايا
                    taskBar.style.width = `calc(${taskDuration * 40}px - 4px)`;
                    taskBar.style.left = '2px';
                    
                    // إضافة نص إذا كانت المدة كافية
                    if (taskDuration >= 3) {
                        const shortName = task.task_name.length > 15 ? 
                            task.task_name.substring(0, 12) + '...' : task.task_name;
                        taskBar.textContent = shortName;
                    }
                    
                    // معلومات التلميح
                    const statusText = getStatusText(task.status);
                    taskBar.title = `${task.task_name}\nالحالة: ${statusText}\nالمدة: ${taskDuration} يوم\nمن: ${task.start_date}\nإلى: ${task.end_date}\n${task.description || ''}`;
                    
                    // أحداث الماوس
                    taskBar.addEventListener('mouseenter', (e) => {
                        showGanttTooltip(e, taskBar.title);
                    });
                    
                    taskBar.addEventListener('mouseleave', () => {
                        hideGanttTooltip();
                    });
                    
                    taskBar.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showTaskDetails(task);
                    });
                    
                    dayCell.appendChild(taskBar);
                }
            }
            
            // تحديد إذا كان اليوم الحالي
            if (currentDate.toDateString() === today.toDateString()) {
                dayCell.classList.add('current-day');
            }
            
            // تحديد إذا كان نهاية الأسبوع
            if (currentDate.getDay() === 5 || currentDate.getDay() === 6) {
                dayCell.classList.add('weekend-day');
            }
            
            taskRow.appendChild(dayCell);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        tbody.appendChild(taskRow);
    });
    
    table.appendChild(tbody);
    
    // إضافة الجدول للحاوية
    ganttContainer.appendChild(table);
    
    // إنشاء عنصر التلميح
    createGanttTooltip(ganttContainer);
    
    // إضافة وسائل الإيضاح
    addLegend(ganttContainer);
}

// Helper function to get day name
function getDayName(dayIndex) {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayIndex] || '';
}

// Create tooltip for Gantt chart
function createGanttTooltip(container) {
    const tooltip = document.createElement('div');
    tooltip.id = 'gantt-simple-tooltip';
    tooltip.className = 'gantt-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '12px 15px';
    tooltip.style.borderRadius = '8px';
    tooltip.style.fontSize = '13px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.zIndex = '1000';
    tooltip.style.maxWidth = '300px';
    tooltip.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
    tooltip.style.borderRight = '4px solid #0ea5e9';
    tooltip.style.fontFamily = '"IBM Plex Sans Arabic", sans-serif';
    tooltip.style.textAlign = 'right';
    tooltip.style.lineHeight = '1.6';
    tooltip.style.whiteSpace = 'pre-line';
    container.appendChild(tooltip);
    
    // إضافة مستمعات الأحداث للجدول
    container.addEventListener('mousemove', (e) => {
        const tooltip = document.getElementById('gantt-simple-tooltip');
        if (tooltip && tooltip.style.opacity === '1') {
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY - 15) + 'px';
        }
    });
}

// Show tooltip
function showGanttTooltip(event, content) {
    const tooltip = document.getElementById('gantt-simple-tooltip');
    if (tooltip) {
        tooltip.innerHTML = content.replace(/\n/g, '<br>');
        tooltip.style.left = (event.pageX + 15) + 'px';
        tooltip.style.top = (event.pageY - 15) + 'px';
        tooltip.style.opacity = '1';
    }
}

// Hide tooltip
function hideGanttTooltip() {
    const tooltip = document.getElementById('gantt-simple-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
    }
}

// Add legend to Gantt chart
function addLegend(container) {
    const legend = document.createElement('div');
    legend.className = 'simple-legend';
    
    const legendItems = [
        { color: '#3b82f6', label: 'لم يبدأ' },
        { color: '#10b981', label: 'قيد التنفيذ' },
        { color: '#f59e0b', label: 'متأخر' },
        { color: '#8b5cf6', label: 'مكتمل جزئياً' },
        { color: '#059669', label: 'مكتمل' }
    ];
    
    legendItems.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'simple-legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color-box';
        colorBox.style.backgroundColor = item.color;
        
        const label = document.createElement('span');
        label.textContent = item.label;
        label.style.color = '#374151';
        label.style.fontFamily = '"IBM Plex Sans Arabic", sans-serif';
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legend.appendChild(legendItem);
    });
    
    container.appendChild(legend);
}

// Helper functions for Gantt chart
function getMonthName(monthIndex) {
    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    return months[monthIndex];
}

function getStatusText(status) {
    const statuses = ["لم يبدأ", "قيد التنفيذ", "متأخر", "مكتمل جزئياً", "مكتمل"];
    return statuses[status] || "غير محدد";
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getRandomStatus(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showTaskDetails(task) {
    const statusText = getStatusText(task.status);
    const message = `
        📋 ${task.task_name}
        
        📅 تاريخ البدء: ${task.start_date}
        📅 تاريخ الانتهاء: ${task.end_date}
        ⏳ المدة: ${task.duration || 'غير محدد'} يوم
        📊 الحالة: ${statusText}
        
        ${task.description || ''}
        ${task.resources ? `\n👥 الموارد: ${task.resources.join(', ')}` : ''}
    `;
    
    alert(message);
}

// Initialize controls
function initControls() {
    // Zoom controls for diagram
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            treeSvg.transition().duration(300).call(zoom.scaleBy, 1.3);
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            treeSvg.transition().duration(300).call(zoom.scaleBy, 0.7);
        });
    }
    
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            treeSvg.transition()
                .duration(500)
                .call(zoom.transform, d3.zoomIdentity.translate(100, 80));
        });
    }
    
    // Expand/collapse all for diagram
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => {
            treeRoot.each(d => {
                if (d._children) {
                    d.children = d._children;
                    d._children = null;
                }
            });
            updateDiagram();
        });
    }
    
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => {
            treeRoot.each(d => {
                if (d.children && d.depth > 0) {
                    d._children = d.children;
                    d.children = null;
                }
            });
            updateDiagram();
        });
    }
    
    // Expand/collapse all for text tree
    if (expandTextTreeBtn) {
        expandTextTreeBtn.addEventListener('click', () => {
            document.querySelectorAll('#wbsTextTree .nested').forEach(nested => {
                nested.classList.add('active');
            });
            document.querySelectorAll('#wbsTextTree .caret').forEach(caret => {
                caret.classList.add('caret-down');
                const icon = caret.querySelector("i");
                if (icon && icon.classList.contains("fa-folder")) {
                    icon.classList.replace("fa-folder", "fa-folder-open");
                }
            });
        });
    }
    
    if (collapseTextTreeBtn) {
        collapseTextTreeBtn.addEventListener('click', () => {
            document.querySelectorAll('#wbsTextTree .nested').forEach(nested => {
                nested.classList.remove('active');
            });
            document.querySelectorAll('#wbsTextTree .caret').forEach(caret => {
                caret.classList.remove('caret-down');
                const icon = caret.querySelector("i");
                if (icon && icon.classList.contains("fa-folder-open")) {
                    icon.classList.replace("fa-folder-open", "fa-folder");
                }
            });
            // Keep first level expanded
            const firstLevel = document.querySelector("#wbsTextTree > li > .nested");
            if (firstLevel) firstLevel.classList.add('active');
        });
    }
}

// Export Gantt as image
function exportGanttAsImage() {
    try {
        const ganttContainer = document.getElementById('gantt-scroll-container');
        
        if (!ganttContainer) {
            alert('❌ عنصر مخطط جانت غير موجود');
            return;
        }
        
        // Add title before capturing
        const originalHTML = ganttContainer.innerHTML;
        ganttContainer.innerHTML = `
            <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #0ea5e9, #0369a1); color: white; border-radius: 8px 8px 0 0; margin-bottom: 15px;">
                <h3 style="font-size: 18px; font-weight: bold; margin: 0;">
                    <i class="fas fa-chart-gantt"></i> مخطط جانت الزمني - ${projectData?.project_info?.name || 'المشروع'}
                </h3>
                <p style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
                    تم إنشاؤه بواسطة Smart Project Planner - ${new Date().toLocaleDateString('ar-SA')}
                </p>
            </div>
            ${originalHTML}
        `;
        
        // استخدام خلفية بيضاء لتصدير أوضح
        html2canvas(ganttContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: ganttContainer.scrollWidth,
            windowHeight: ganttContainer.scrollHeight,
            onclone: function(clonedDoc) {
                const clonedContainer = clonedDoc.getElementById('gantt-scroll-container');
                if (clonedContainer) {
                    clonedContainer.style.overflow = 'visible';
                    clonedContainer.style.width = clonedContainer.scrollWidth + 'px';
                }
            }
        }).then(canvas => {
            // Restore original content
            ganttContainer.innerHTML = originalHTML;
            
            const link = document.createElement('a');
            link.download = `مخطط_جانت_${projectData?.project_info?.name || 'مشروع'}_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Show success message
            showNotification('✅ تم تصدير مخطط جانت بنجاح', 'success');
        }).catch(error => {
            console.error('Error exporting Gantt:', error);
            showNotification('❌ حدث خطأ أثناء تصدير مخطط جانت', 'error');
            ganttContainer.innerHTML = originalHTML;
        });
        
    } catch (error) {
        console.error('Error exporting Gantt:', error);
        showNotification('❌ حدث خطأ أثناء تصدير مخطط جانت', 'error');
    }
}

// Export WBS Diagram as image
function exportWbsAsImage() {
    try {
        const diagramContainer = document.querySelector('.diagram-container');
        
        if (!diagramContainer) {
            alert('❌ حاوية مخطط WBS غير موجودة');
            return;
        }
        
        // Clone container to add title
        const clonedContainer = diagramContainer.cloneNode(true);
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = `
            text-align: center;
            padding: 15px;
            background: linear-gradient(135deg, #f39c12, #e67e22);
            color: white;
            border-radius: 8px 8px 0 0;
            margin-bottom: 15px;
            font-family: 'IBM Plex Sans Arabic', sans-serif;
        `;
        titleDiv.innerHTML = `
            <h3 style="font-size: 18px; font-weight: bold; margin: 0;">
                <i class="fas fa-project-diagram"></i> مخطط هيكل تقسيم العمل (WBS) - ${projectData?.project_info?.name || 'المشروع'}
            </h3>
            <p style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
                تم إنشاؤه بواسطة Smart Project Planner - ${new Date().toLocaleDateString('ar-SA')}
            </p>
        `;
        
        // Create temporary container
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: ${diagramContainer.offsetWidth}px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        tempContainer.appendChild(titleDiv);
        tempContainer.appendChild(clonedContainer);
        document.body.appendChild(tempContainer);
        
        // Adjust SVG size for better quality
        const svg = clonedContainer.querySelector('svg');
        if (svg) {
            svg.setAttribute('width', diagramContainer.offsetWidth - 20);
            svg.setAttribute('height', diagramContainer.offsetHeight - 20);
        }
        
        // Capture as image
        html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: tempContainer.offsetWidth,
            height: tempContainer.offsetHeight + 50
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `مخطط_WBS_${projectData?.project_info?.name || 'مشروع'}_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Clean up
            document.body.removeChild(tempContainer);
            
            // Show success message
            showNotification('✅ تم تصدير مخطط WBS بنجاح', 'success');
        }).catch(error => {
            console.error('Error exporting WBS:', error);
            document.body.removeChild(tempContainer);
            showNotification('❌ حدث خطأ أثناء تصدير مخطط WBS', 'error');
        });
        
    } catch (error) {
        console.error('Error exporting WBS:', error);
        showNotification('❌ حدث خطأ أثناء تصدير مخطط WBS', 'error');
    }
}



// Capture diagrams as images for Word
async function captureDiagramsForWord() {
    const images = {};
    
    try {
        // Capture WBS Diagram
        const diagramContainer = document.querySelector('.diagram-container');
        if (diagramContainer) {
            const tempContainer = diagramContainer.cloneNode(true);
            tempContainer.style.cssText = `
                width: 800px;
                height: 500px;
                background: white;
                position: fixed;
                left: -9999px;
                top: 0;
                overflow: visible;
            `;
            
            // Adjust SVG
            const svg = tempContainer.querySelector('svg');
            if (svg) {
                svg.setAttribute('width', '780');
                svg.setAttribute('height', '480');
            }
            
            document.body.appendChild(tempContainer);
            
            const canvas = await html2canvas(tempContainer, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 800,
                height: 500
            });
            
            images.wbs = canvas.toDataURL('image/png');
            document.body.removeChild(tempContainer);
        }
        
        // Capture Gantt Chart
        const ganttContainer = document.getElementById('gantt-scroll-container');
        if (ganttContainer) {
            const originalHTML = ganttContainer.innerHTML;
            
            // Add title
            ganttContainer.innerHTML = `
                <div style="text-align: center; padding: 10px; background: #0ea5e9; color: white; font-weight: bold;">
                    مخطط جانت الزمني
                </div>
                ${originalHTML}
            `;
            
            const canvas = await html2canvas(ganttContainer, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: ganttContainer.scrollWidth,
                height: ganttContainer.scrollHeight + 50
            });
            
            images.gantt = canvas.toDataURL('image/png');
            ganttContainer.innerHTML = originalHTML;
        }
        
    } catch (error) {
        console.error('Error capturing diagrams:', error);
    }
    
    return images;
}



// Helper function to show notifications
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.getElementById('custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'custom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-family: 'IBM Plex Sans Arabic', sans-serif;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    // Set color based on type
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    }
    
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 3000);
    
    // Add CSS for animations
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Demo function to load example project
function loadDemoProject() {
    const demoDescription = "تطبيق ويب لإدارة المهام والمشاريع للفرق البرمجية مع نظام متابعة وإشعارات وتقارير أداء متقدمة. المشروع يشمل فريق من 6 أفراد: مدير مشروع، مبرمجين فرونت إند (2)، مبرمج باك إند (2)، مصمم واجهات، واختصاصي جودة.";
    document.getElementById('projectDescription').value = demoDescription;
    
    // تشغيل النموذج مباشرة
    const event = new Event('submit');
    document.getElementById('projectForm').dispatchEvent(event);
}







