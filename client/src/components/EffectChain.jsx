import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { EFFECT_PRESETS } from '../utils/mixer';

const EffectChain = ({ chain, disabled }) => {
  const [nodes, setNodes] = useState([]);
  const [currentPreset, setCurrentPreset] = useState('CLEAN');

  useEffect(() => {
    if (chain) {
      setNodes(chain.getNodes());
      setCurrentPreset(chain.getCurrentPreset());
    }
  }, [chain]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    
    chain.moveNode(fromIndex, toIndex);
    setNodes(chain.getNodes());
  };

  const handlePresetChange = (presetId) => {
    if (!disabled && chain) {
      chain.applyPreset(presetId);
      setNodes(chain.getNodes());
      setCurrentPreset(presetId);
    }
  };

  const getEffectColor = (type) => {
    switch (type) {
      case 'eq': return '#646cff';
      case 'effect': return '#ff4a4a';
      case 'filter': return '#a4a9ff';
      case 'beat': return '#ff9900';
      default: return '#646cff';
    }
  };

  return (
    <div className="effect-chain">
      <div className="effect-chain-header">
        <h4>EFFECT CHAIN</h4>
        <select
          value={currentPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="preset-selector"
          disabled={disabled}
        >
          {Object.entries(EFFECT_PRESETS).map(([id, preset]) => (
            <option key={id} value={id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="effect-list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="effect-list"
            >
              {nodes.map((node, index) => (
                <Draggable
                  key={node.name}
                  draggableId={node.name}
                  index={index}
                  isDragDisabled={disabled}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`effect-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      style={{
                        ...provided.draggableProps.style,
                        backgroundColor: `${getEffectColor(node.type)}33`,
                        borderColor: getEffectColor(node.type)
                      }}
                    >
                      <span className="effect-name">{node.name}</span>
                      <span className="effect-handle">⋮</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default EffectChain;