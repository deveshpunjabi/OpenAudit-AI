"""
Flask API Backend for OpenAudit AI
Author: deveshpunjabi
Date: 2025-01-15 07:07:03 UTC

This Flask app provides API endpoints for AI text detection using ModernBERT models.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime
import logging

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our AI detector
from ai_text_detector import AITextDetector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize AI detector
detector = AITextDetector()

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'OpenAudit AI Backend',
        'author': 'deveshpunjabi',
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
        'ai_detection': 'available'
    })

@app.route('/api/ai-detect', methods=['POST'])
def detect_ai():
    """
    AI Detection endpoint
    Accepts text and returns AI detection analysis
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing text parameter',
                'status': 'error'
            }), 400
        
        text = data['text']
        
        if not text or not text.strip():
            return jsonify({
                'error': 'Empty text provided',
                'status': 'error'
            }), 400
        
        logger.info(f"🔍 Analyzing text: {len(text)} characters")
        
        # Perform AI detection
        result = detector.analyze_text(text)
        
        # Add API metadata
        result['api_version'] = '1.0.0'
        result['endpoint'] = '/api/ai-detect'
        result['status'] = 'success'
        
        logger.info(f"✅ Analysis complete: {'AI' if result['isAI'] else 'Human'} ({result['confidence']:.1f}%)")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ AI detection error: {str(e)}")
        return jsonify({
            'error': f'Analysis failed: {str(e)}',
            'status': 'error',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
        }), 500

@app.route('/api/ai-detect/sentences', methods=['POST'])
def detect_ai_sentences():
    """
    Sentence-by-sentence AI detection endpoint
    Analyzes text sentence by sentence for detailed results
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing text parameter',
                'status': 'error'
            }), 400
        
        text = data['text']
        
        if not text or not text.strip():
            return jsonify({
                'error': 'Empty text provided',
                'status': 'error'
            }), 400
        
        logger.info(f"🔍 Analyzing sentences in text: {len(text)} characters")
        
        # Split into sentences
        sentences = [s.strip() for s in text.replace('!', '.').replace('?', '.').split('.') if s.strip() and len(s.strip()) > 10]
        
        results = []
        current_index = 0
        
        for i, sentence in enumerate(sentences):
            # Find sentence position in original text
            start_index = text.find(sentence, current_index)
            end_index = start_index + len(sentence)
            
            # Analyze sentence
            analysis = detector.analyze_text(sentence)
            
            # Format result for frontend
            result = {
                'text': sentence,
                'isAI': analysis['isAI'],
                'confidence': analysis['confidence'] / 100,  # Convert to 0-1 range
                'startIndex': start_index,
                'endIndex': end_index,
                'reasons': [
                    f"ModernBERT Analysis: {analysis['mostLikelyModel']}",
                    f"Detection Method: {analysis['detectionMethod']}",
                    f"AI Probability: {analysis['aiProb']:.1f}%"
                ] if analysis['isAI'] else [
                    f"Human-written content detected",
                    f"Human Probability: {analysis['humanProb']:.1f}%"
                ]
            }
            
            results.append(result)
            current_index = end_index
        
        # Calculate overall statistics
        ai_sentences = sum(1 for r in results if r['isAI'])
        total_sentences = len(results)
        ai_percentage = (ai_sentences / total_sentences * 100) if total_sentences > 0 else 0
        
        response = {
            'results': results,
            'stats': {
                'totalSentences': total_sentences,
                'aiSentences': ai_sentences,
                'humanSentences': total_sentences - ai_sentences,
                'aiPercentage': ai_percentage,
                'humanPercentage': 100 - ai_percentage
            },
            'metadata': {
                'textLength': len(text),
                'wordCount': len(text.split()),
                'detectionMethod': detector.detection_method,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
                'author': 'deveshpunjabi'
            },
            'status': 'success'
        }
        
        logger.info(f"✅ Sentence analysis complete: {ai_sentences}/{total_sentences} AI sentences ({ai_percentage:.1f}%)")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Sentence analysis error: {str(e)}")
        return jsonify({
            'error': f'Sentence analysis failed: {str(e)}',
            'status': 'error',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
        }), 500

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Get information about loaded AI detection models"""
    try:
        model_info = detector.get_model_info()
        model_info['status'] = 'success'
        model_info['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
        model_info['author'] = 'deveshpunjabi'
        
        return jsonify(model_info)
        
    except Exception as e:
        logger.error(f"❌ Model info error: {str(e)}")
        return jsonify({
            'error': f'Failed to get model info: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get backend service status"""
    try:
        model_info = detector.get_model_info()
        
        return jsonify({
            'service': 'OpenAudit AI Backend',
            'status': 'running',
            'ai_detection': {
                'available': True,
                'mode': model_info['mode'],
                'models_loaded': len(model_info['models']),
                'accuracy': model_info['accuracy']
            },
            'endpoints': [
                '/api/ai-detect',
                '/api/ai-detect/sentences',
                '/api/model-info',
                '/api/status'
            ],
            'author': 'deveshpunjabi',
            'version': '1.0.0',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
        })
        
    except Exception as e:
        logger.error(f"❌ Status check error: {str(e)}")
        return jsonify({
            'service': 'OpenAudit AI Backend',
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
        }), 500

if __name__ == '__main__':
    print("🚀 Starting OpenAudit AI Backend...")
    print(f"👤 Author: deveshpunjabi")
    print(f"📅 Date: 2025-01-15 07:07:03 UTC")
    print(f"🔧 Initializing AI detection models...")
    
    # Check if models are available
    model_info = detector.get_model_info()
    print(f"🤖 AI Detection Mode: {model_info['mode']}")
    print(f"📊 Models: {', '.join(model_info['models'])}")
    print(f"🎯 Accuracy: {model_info['accuracy']}")
    
    # Start Flask server
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print(f"🌐 Starting server on port {port}")
    print(f"🔗 API endpoints available at http://localhost:{port}/api/")
    print(f"✅ Backend ready for AI detection requests!")
    
    app.run(host='0.0.0.0', port=port, debug=debug)